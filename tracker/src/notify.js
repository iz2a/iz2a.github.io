// Alert formatting and delivery: Telegram and ntfy.

import { shortBrowser, shortOS } from './ua.js';
import { networkHint } from './enrich.js';

export function flagEmoji(cc) {
    if (!cc || cc.length !== 2 || cc === 'XX' || cc === 'T1') return '🌐';
    const A = 0x1F1E6;
    return String.fromCodePoint(A + cc.charCodeAt(0) - 65, A + cc.charCodeAt(1) - 65);
}

export function timeAgo(iso, now = Date.now()) {
    if (!iso) return '';
    const ms = now - new Date(iso).getTime();
    const s = Math.round(ms / 1000);
    if (s < 60) return s + 's ago';
    const m = Math.round(s / 60);
    if (m < 60) return m + 'm ago';
    const h = Math.round(m / 60);
    if (h < 48) return h + 'h ago';
    const d = Math.round(h / 24);
    return d + 'd ago';
}

function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function refHost(ref) {
    if (!ref) return '';
    try { return new URL(ref).host.replace(/^www\./, ''); } catch { return ref; }
}

// ctx: { event, enriched, visitor (row or null), session (row or null), isNewVisitor, isNewSession, env }
export function buildAlert(ctx) {
    const { event, enriched: e, visitor, isNewVisitor, isNewSession, env } = ctx;
    const d = event.data || {};
    const p = e.parsed;

    let headline;
    if (e.isBot) headline = '🤖 Bot hit';
    else if (isNewVisitor) headline = '🟢 New visitor';
    else if (isNewSession) headline = `🔁 Returning visitor, visit #${visitor ? visitor.visits + 1 : '?'}` + (visitor && visitor.last_seen ? `, last seen ${timeAgo(visitor.last_seen)}` : '');
    else headline = `📄 Page view (same visit)`;

    const place = [e.city, e.region, e.country].filter(Boolean).join(', ') || 'Unknown location';
    const net = [e.asn ? 'AS' + e.asn : null, e.asOrg].filter(Boolean).join(' ');
    const hint = networkHint(e.asOrg);
    const screen = d.screen ? `${d.screen.w}x${d.screen.h}` + (d.screen.dpr && d.screen.dpr !== 1 ? ` @${d.screen.dpr}x` : '') : '';
    const langs = d.languages ? d.languages.slice(0, 3).join(',') : (e.headers['accept-language'] || '').split(',')[0];
    const tz = d.timezone || e.timezone || '';
    const ref = event.referrer ? refHost(event.referrer) : 'direct';
    const utm = event.utm && Object.keys(event.utm).length ? ' · ' + Object.entries(event.utm).map(([k, v]) => `${k.replace('utm_', '')}=${v}` ).join(' ') : '';
    const vid = (event.visitorId || '').slice(0, 8);
    const dash = env.PUBLIC_URL && event.visitorId ? `${env.PUBLIC_URL.replace(/\/$/, '')}/dashboard/visitor/${encodeURIComponent(event.visitorId)}` : null;

    const lines = [
        `<b>${esc(headline)}</b>`,
        `📄 <code>${esc(event.path || event.url || '/')}</code>${event.title ? ' · ' + esc(event.title) : ''}`,
        `${flagEmoji(e.country)} ${esc(place)}${e.postal ? ' ' + esc(e.postal) : ''}`,
        net ? `🏢 ${esc(net)}${hint ? ' <i>(' + esc(hint) + ')</i>' : ''}` : null,
        `🌐 IP <code>${esc(e.ip || '?')}</code>${e.httpProtocol ? ' · ' + esc(e.httpProtocol) : ''}${e.tlsVersion ? ' · ' + esc(e.tlsVersion) : ''}${e.colo ? ' · via ' + esc(e.colo) : ''}`,
        `💻 ${esc(shortBrowser(p))} on ${esc(shortOS(p))} · ${esc(p.device)}${screen ? ' · ' + esc(screen) : ''}`,
        (langs || tz) ? `🗣 ${esc(langs || '?')}${tz ? ' · ' + esc(tz) : ''}` : null,
        `🔗 From: ${esc(ref)}${esc(utm)}`,
        `🆔 visitor <code>${esc(vid)}</code>`,
        dash ? `<a href="${esc(dash)}">Open visitor history</a>` : null
    ].filter(Boolean);

    const html = lines.join('\n');
    const plain = html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const title = `${flagEmoji(e.country)} ${e.city || e.country || 'Visitor'} · ${shortBrowser(p)} · ${event.path || '/'}`;

    return { html, plain, title, headline, dashboardUrl: dash, isBot: e.isBot };
}

export async function sendTelegram(env, alert) {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return { skipped: 'telegram not configured' };
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: alert.html,
            parse_mode: 'HTML',
            disable_web_page_preview: true
        })
    });
    if (!res.ok) return { error: 'telegram ' + res.status + ' ' + (await res.text()).slice(0, 200) };
    return { ok: true };
}

export async function sendNtfy(env, alert) {
    if (!env.NTFY_TOPIC) return { skipped: 'ntfy not configured' };
    const base = (env.NTFY_SERVER || 'https://ntfy.sh').replace(/\/$/, '');
    const headers = {
        'Title': alert.title.replace(/[^\x20-\x7E -￿]/g, ''),
        'Tags': alert.isBot ? 'robot' : 'eyes',
        'Priority': alert.isBot ? '2' : '3'
    };
    if (alert.dashboardUrl) headers['Click'] = alert.dashboardUrl;
    if (env.NTFY_TOKEN) headers['Authorization'] = 'Bearer ' + env.NTFY_TOKEN;
    const res = await fetch(`${base}/${encodeURIComponent(env.NTFY_TOPIC)}`, { method: 'POST', headers, body: alert.plain });
    if (!res.ok) return { error: 'ntfy ' + res.status + ' ' + (await res.text()).slice(0, 200) };
    return { ok: true };
}

export async function notifyAll(env, alert) {
    const results = await Promise.allSettled([sendTelegram(env, alert), sendNtfy(env, alert)]);
    return results.map(r => r.status === 'fulfilled' ? r.value : { error: String(r.reason) });
}
