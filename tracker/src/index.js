// aziz.life visitor tracker: Cloudflare Worker entry point.
//
//   POST /collect              beacon endpoint used by /tracker.js on the site
//   GET  /dashboard            overview (Basic auth)
//   GET  /dashboard/visitors   recent visitors
//   GET  /dashboard/visitor/:id
//   GET  /dashboard/ip/:ip
//   GET  /dashboard/export.csv?days=30
//   GET  /health

import { enrichRequest } from './enrich.js';
import { buildAlert, notifyAll } from './notify.js';
import { getVisitor, getSession, isSessionStale, recordEvent } from './db.js';
import { renderOverview, renderVisitors, renderVisitor, renderIp, renderCsv } from './dashboard.js';

const MAX_BODY = 64 * 1024;
const MAX_EVENTS = 25;
const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname.replace(/\/+$/, '') || '/';

        try {
            if (path === '/collect') return handleCollect(request, env, ctx, url);
            if (path === '/health') return new Response('ok', { headers: { 'cache-control': 'no-store' } });
            if (path === '/' ) return new Response('aziz.life tracker\n', { headers: { 'content-type': 'text/plain' } });
            if (path === '/dashboard' || path.startsWith('/dashboard/')) return handleDashboard(request, env, url, path);
            return new Response('not found', { status: 404 });
        } catch (err) {
            console.error('unhandled', err && err.stack || err);
            return new Response('error', { status: 500 });
        }
    }
};

// ---------------------------------------------------------------------------
// /collect

function allowedOrigins(env) {
    return (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
}

function originOf(request) {
    const o = request.headers.get('origin');
    if (o) return o.replace(/\/$/, '');
    const r = request.headers.get('referer');
    if (r) { try { return new URL(r).origin; } catch { return null; } }
    return null;
}

function corsHeaders(origin) {
    return {
        'access-control-allow-origin': origin || '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
        'access-control-max-age': '86400',
        'vary': 'origin',
        'cache-control': 'no-store'
    };
}

async function handleCollect(request, env, ctx, url) {
    const origin = originOf(request);
    const allowed = allowedOrigins(env);
    const originOk = origin && allowed.includes(origin);

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: originOk ? 204 : 403, headers: corsHeaders(origin) });
    }
    if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });
    if (!originOk) return new Response('forbidden', { status: 403, headers: corsHeaders(origin) });

    const len = Number(request.headers.get('content-length') || 0);
    if (len > MAX_BODY) return new Response('too large', { status: 413, headers: corsHeaders(origin) });

    let payload;
    try {
        const text = await request.text();
        if (text.length > MAX_BODY) return new Response('too large', { status: 413, headers: corsHeaders(origin) });
        payload = JSON.parse(text);
    } catch {
        return new Response('bad json', { status: 400, headers: corsHeaders(origin) });
    }

    const events = normalizeEvents(payload);
    if (!events.length) return new Response('no events', { status: 400, headers: corsHeaders(origin) });

    const enriched = enrichRequest(request);
    // Do the storage and alerting after responding; beacons do not wait.
    ctx.waitUntil(processEvents(events, enriched, env).catch(err => console.error('process failed', err && err.stack || err)));

    return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

function str(v, max = 2048) {
    if (v == null) return null;
    const s = String(v);
    return s.length > max ? s.slice(0, max) : s;
}

function normalizeEvents(payload) {
    const list = Array.isArray(payload) ? payload : (payload && Array.isArray(payload.events) ? payload.events : [payload]);
    const out = [];
    for (const raw of list.slice(0, MAX_EVENTS)) {
        if (!raw || typeof raw !== 'object') continue;
        const type = str(raw.type, 32) || 'pageview';
        if (!/^[a-z_]+$/.test(type)) continue;
        let pathOnly = str(raw.path, 1024);
        if (!pathOnly && raw.url) { try { pathOnly = new URL(raw.url).pathname; } catch { /* ignore */ } }
        const utm = {};
        if (raw.utm && typeof raw.utm === 'object') {
            for (const k of Object.keys(raw.utm).slice(0, 10)) if (/^utm_[a-z]+$/.test(k)) utm[k] = str(raw.utm[k], 200);
        }
        out.push({
            type,
            visitorId: ID_RE.test(raw.visitorId || '') ? raw.visitorId : null,
            sessionId: ID_RE.test(raw.sessionId || '') ? raw.sessionId : null,
            url: str(raw.url),
            path: pathOnly,
            title: str(raw.title, 300),
            referrer: str(raw.referrer),
            utm: Object.keys(utm).length ? utm : null,
            data: raw.data && typeof raw.data === 'object' ? raw.data : {}
        });
    }
    return out;
}

async function processEvents(events, enriched, env) {
    const db = env.DB;
    // Events in one beacon come from one visitor; look up state once.
    const first = events[0];
    let visitor = await getVisitor(db, first.visitorId);
    let session = await getSession(db, first.sessionId);

    const nowMs = Date.now();
    let isNewVisitor = !visitor && !!first.visitorId;
    let isNewSession = !!first.sessionId && isSessionStale(session, nowMs);

    for (const event of events) {
        const now = new Date().toISOString();
        await recordEvent(db, { event, enriched, now, isNewVisitor, isNewSession, visitor, session });

        if (event.type === 'pageview' && (!enriched.isBot || String(env.NOTIFY_BOTS).toLowerCase() === 'true')) {
            const alert = buildAlert({ event, enriched, visitor, isNewVisitor, isNewSession, env });
            const results = await notifyAll(env, alert);
            for (const r of results) if (r && r.error) console.warn('notify', r.error);
        }

        // After the first event in a batch the visitor and session exist.
        if (isNewVisitor) { visitor = { id: event.visitorId, visits: isNewSession ? 1 : 0, last_seen: now }; isNewVisitor = false; }
        if (isNewSession) { session = { id: event.sessionId, last_seen: now }; isNewSession = false; }
    }
}

// ---------------------------------------------------------------------------
// /dashboard

function timingSafeEqual(a, b) {
    const ea = new TextEncoder().encode(a), eb = new TextEncoder().encode(b);
    if (ea.length !== eb.length) return false;
    let diff = 0;
    for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
    return diff === 0;
}

function unauthorized() {
    return new Response('Authentication required', {
        status: 401,
        headers: { 'www-authenticate': 'Basic realm="tracker dashboard", charset="UTF-8"', 'cache-control': 'no-store' }
    });
}

function checkAuth(request, env) {
    if (!env.DASHBOARD_PASSWORD) return 'unset';
    const h = request.headers.get('authorization') || '';
    if (!h.startsWith('Basic ')) return false;
    let decoded;
    try { decoded = atob(h.slice(6)); } catch { return false; }
    const idx = decoded.indexOf(':');
    if (idx < 0) return false;
    const user = decoded.slice(0, idx), pass = decoded.slice(idx + 1);
    return timingSafeEqual(user, env.DASHBOARD_USER || 'aziz') && timingSafeEqual(pass, env.DASHBOARD_PASSWORD);
}

async function handleDashboard(request, env, url, path) {
    const auth = checkAuth(request, env);
    if (auth === 'unset') return new Response('Dashboard password not set. Run: npx wrangler secret put DASHBOARD_PASSWORD', { status: 503 });
    if (!auth) return unauthorized();

    const html = body => new Response(body, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });

    if (path === '/dashboard') return html(await renderOverview(env, url));
    if (path === '/dashboard/visitors') return html(await renderVisitors(env));
    if (path === '/dashboard/export.csv') {
        return new Response(await renderCsv(env, url), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="aziz-life-events.csv"', 'cache-control': 'no-store' } });
    }
    let m;
    if ((m = /^\/dashboard\/visitor\/([^/]+)$/.exec(path))) return html(await renderVisitor(env, decodeURIComponent(m[1])));
    if ((m = /^\/dashboard\/ip\/([^/]+)$/.exec(path))) return html(await renderIp(env, decodeURIComponent(m[1])));
    return new Response('not found', { status: 404 });
}
