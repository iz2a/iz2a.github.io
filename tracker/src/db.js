// D1 access. Every incoming event is stored; visitors and sessions are
// rolled up so the dashboard and the alerts can say "returning, 4th visit".

import { shortBrowser, shortOS } from './ua.js';

const SESSION_GAP_MS = 30 * 60 * 1000;

function j(v) { return v == null ? null : JSON.stringify(v); }

export async function getVisitor(db, id) {
    if (!id) return null;
    return await db.prepare('SELECT * FROM visitors WHERE id = ?').bind(id).first();
}

export async function getSession(db, id) {
    if (!id) return null;
    return await db.prepare('SELECT * FROM sessions WHERE id = ?').bind(id).first();
}

export function isSessionStale(session, nowMs) {
    if (!session) return true;
    return nowMs - new Date(session.last_seen).getTime() > SESSION_GAP_MS;
}

export async function recordEvent(db, { event, enriched: e, now, isNewVisitor, isNewSession, visitor, session }) {
    const d = event.data || {};
    const p = e.parsed;
    const isPageview = event.type === 'pageview';
    const stmts = [];

    // visitors
    const profile = isPageview ? j({ screen: d.screen, viewport: d.viewport, languages: d.languages, timezone: d.timezone, platform: d.platform, mobile: d.mobile, touch: d.touch }) : null;
    if (isNewVisitor) {
        stmts.push(db.prepare(`INSERT INTO visitors (id, first_seen, last_seen, visits, pageviews, first_ip, last_ip, last_country, last_city, last_as_org, last_ua, is_bot, profile_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(event.visitorId, now, now, isNewSession ? 1 : 0, isPageview ? 1 : 0,
                e.ip, e.ip, e.country, e.city, e.asOrg, e.ua, e.isBot ? 1 : 0, profile));
    } else if (visitor) {
        stmts.push(db.prepare(`UPDATE visitors SET last_seen = ?, visits = visits + ?, pageviews = pageviews + ?, last_ip = ?, last_country = ?, last_city = ?, last_as_org = ?, last_ua = ?,
            profile_json = COALESCE(?, profile_json), is_bot = ? WHERE id = ?`)
            .bind(now, isNewSession ? 1 : 0, isPageview ? 1 : 0, e.ip, e.country, e.city, e.asOrg, e.ua,
                profile, e.isBot ? 1 : 0, event.visitorId));
    }

    // sessions
    if (event.sessionId) {
        if (isNewSession) {
            stmts.push(db.prepare(`INSERT OR IGNORE INTO sessions (id, visitor_id, started_at, last_seen, pageviews, duration_ms, entry_page, exit_page, referrer, utm_json, ip, country, region, city, asn, as_org, ua, browser, os, device, is_bot)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                .bind(event.sessionId, event.visitorId, now, now, isPageview ? 1 : 0, event.path, event.path, event.referrer || null, j(event.utm || null),
                    e.ip, e.country, e.region, e.city, e.asn, e.asOrg, e.ua, shortBrowser(p), shortOS(p), p.device, e.isBot ? 1 : 0));
        } else if (session) {
            const dur = typeof d.sessionDurationMs === 'number' ? d.sessionDurationMs : null;
            stmts.push(db.prepare(`UPDATE sessions SET last_seen = ?, pageviews = pageviews + ?, exit_page = ?, duration_ms = MAX(duration_ms, COALESCE(?, 0)) WHERE id = ?`)
                .bind(now, isPageview ? 1 : 0, event.path, dur, event.sessionId));
        }
    }

    // events
    stmts.push(db.prepare(`INSERT INTO events (ts, type, visitor_id, session_id, url, path, title, referrer, utm_json,
            ip, country, region, city, postal, lat, lon, timezone, asn, as_org, colo, http_protocol, tls_version,
            ua, browser, browser_ver, os, device, language, screen, viewport, is_bot, data_json, headers_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(now, event.type, event.visitorId || null, event.sessionId || null,
            event.url || null, event.path || null, event.title || null, event.referrer || null, j(event.utm || null),
            e.ip, e.country, e.region, e.city, e.postal, e.lat, e.lon, d.timezone || e.timezone || null, e.asn, e.asOrg, e.colo, e.httpProtocol, e.tlsVersion,
            e.ua, p.browser, p.browserVersion, shortOS(p), p.device,
            d.languages ? d.languages.join(',') : (e.headers['accept-language'] || null),
            d.screen ? `${d.screen.w}x${d.screen.h}@${d.screen.dpr || 1}` : null,
            d.viewport ? `${d.viewport.w}x${d.viewport.h}` : null,
            e.isBot ? 1 : 0, j(d), j(e.headers)));

    await db.batch(stmts);
}

// Dashboard queries ----------------------------------------------------------

export async function overview(db, hours) {
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    const [totals, recent, pages, countries, refs, browsers, bots] = await Promise.all([
        db.prepare(`SELECT COUNT(*) AS pageviews, COUNT(DISTINCT visitor_id) AS visitors, COUNT(DISTINCT session_id) AS sessions
                    FROM events WHERE type = 'pageview' AND is_bot = 0 AND ts >= ?`).bind(since).first(),
        db.prepare(`SELECT id, ts, type, visitor_id, session_id, path, title, referrer, ip, country, city, as_org, browser, browser_ver, os, device, screen, is_bot, data_json
                    FROM events WHERE ts >= ? ORDER BY ts DESC LIMIT 200`).bind(since).all(),
        db.prepare(`SELECT path, COUNT(*) AS n, COUNT(DISTINCT visitor_id) AS v FROM events WHERE type = 'pageview' AND is_bot = 0 AND ts >= ? GROUP BY path ORDER BY n DESC LIMIT 15`).bind(since).all(),
        db.prepare(`SELECT country, city, COUNT(*) AS n FROM events WHERE type = 'pageview' AND is_bot = 0 AND ts >= ? GROUP BY country, city ORDER BY n DESC LIMIT 15`).bind(since).all(),
        db.prepare(`SELECT referrer, COUNT(*) AS n FROM events WHERE type = 'pageview' AND is_bot = 0 AND ts >= ? AND referrer IS NOT NULL AND referrer != '' GROUP BY referrer ORDER BY n DESC LIMIT 15`).bind(since).all(),
        db.prepare(`SELECT browser || ' / ' || os AS b, device, COUNT(*) AS n FROM events WHERE type = 'pageview' AND is_bot = 0 AND ts >= ? GROUP BY b, device ORDER BY n DESC LIMIT 15`).bind(since).all(),
        db.prepare(`SELECT COUNT(*) AS n FROM events WHERE is_bot = 1 AND ts >= ?`).bind(since).first()
    ]);
    return { since, totals, recent: recent.results, pages: pages.results, countries: countries.results, refs: refs.results, browsers: browsers.results, bots: bots.n };
}

export async function visitorDetail(db, id) {
    const [visitor, sessions, events] = await Promise.all([
        db.prepare('SELECT * FROM visitors WHERE id = ?').bind(id).first(),
        db.prepare('SELECT * FROM sessions WHERE visitor_id = ? ORDER BY started_at DESC LIMIT 50').bind(id).all(),
        db.prepare('SELECT * FROM events WHERE visitor_id = ? ORDER BY ts DESC LIMIT 500').bind(id).all()
    ]);
    return { visitor, sessions: sessions.results, events: events.results };
}

export async function listVisitors(db, limit) {
    const r = await db.prepare('SELECT * FROM visitors ORDER BY last_seen DESC LIMIT ?').bind(limit).all();
    return r.results;
}

export async function eventsByIp(db, ip) {
    const r = await db.prepare('SELECT * FROM events WHERE ip = ? ORDER BY ts DESC LIMIT 500').bind(ip).all();
    return r.results;
}

export async function exportEvents(db, days) {
    const since = new Date(Date.now() - days * 86400 * 1000).toISOString();
    const r = await db.prepare('SELECT * FROM events WHERE ts >= ? ORDER BY ts DESC LIMIT 20000').bind(since).all();
    return r.results;
}
