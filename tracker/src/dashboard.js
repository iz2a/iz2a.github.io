// Server rendered dashboard. Plain HTML, no build step, Times New Roman to match the site.

import { overview, visitorDetail, listVisitors, eventsByIp, exportEvents } from './db.js';
import { flagEmoji, timeAgo } from './notify.js';

function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtTs(iso) {
    if (!iso) return '';
    return iso.replace('T', ' ').replace(/\.\d+Z$/, 'Z');
}

function fmtDur(ms) {
    if (!ms) return '0s';
    const s = Math.round(ms / 1000);
    if (s < 60) return s + 's';
    return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
}

const CSS = `
:root { --bg:#0b1220; --card:#121b2e; --line:#223050; --fg:#e6ecf5; --muted:#8fa0bd; --accent:#4fb3ff; --warn:#ffb347; --bot:#8a93a8; }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--fg); font-family:"Times New Roman", Times, serif; font-size:15px; }
a { color:var(--accent); text-decoration:none; } a:hover { text-decoration:underline; }
header { padding:16px 24px; border-bottom:1px solid var(--line); display:flex; gap:20px; align-items:baseline; flex-wrap:wrap; }
header h1 { margin:0; font-size:20px; font-weight:normal; }
header nav a { margin-right:14px; }
main { padding:20px 24px; max-width:1500px; margin:0 auto; }
.cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:20px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:8px; padding:14px 16px; }
.card .n { font-size:28px; } .card .l { color:var(--muted); font-size:13px; }
.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:16px; margin-bottom:20px; }
h2 { font-size:16px; font-weight:normal; color:var(--muted); margin:0 0 8px; text-transform:uppercase; letter-spacing:.06em; }
table { width:100%; border-collapse:collapse; font-size:14px; }
th, td { text-align:left; padding:6px 8px; border-bottom:1px solid var(--line); vertical-align:top; }
th { color:var(--muted); font-weight:normal; font-size:12px; text-transform:uppercase; letter-spacing:.05em; }
tr.bot td { color:var(--bot); }
code { font-family:Consolas, Menlo, monospace; font-size:13px; background:#0d1526; padding:1px 4px; border-radius:3px; }
.muted { color:var(--muted); } .wrap { overflow-x:auto; }
.tag { display:inline-block; font-size:11px; padding:1px 6px; border-radius:10px; border:1px solid var(--line); color:var(--muted); margin-left:4px; }
details summary { cursor:pointer; color:var(--accent); }
pre { background:#0d1526; border:1px solid var(--line); padding:10px; border-radius:6px; overflow:auto; font-size:12px; max-height:420px; }
form.range { display:inline-block; } form.range select { background:var(--card); color:var(--fg); border:1px solid var(--line); padding:4px 8px; font-family:inherit; }
dl { display:grid; grid-template-columns:max-content 1fr; gap:4px 14px; margin:0; } dt { color:var(--muted); } dd { margin:0; }
`;

function layout(title, body, env) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${esc(title)} · ${esc(env.SITE_NAME || 'tracker')}</title><style>${CSS}</style></head>
<body><header><h1>${esc(env.SITE_NAME || 'Site')} visitor tracker</h1>
<nav><a href="/dashboard">Overview</a><a href="/dashboard/visitors">Visitors</a><a href="/dashboard/export.csv?days=30">Export CSV (30d)</a></nav></header>
<main>${body}</main></body></html>`;
}

function visitorLink(id) {
    if (!id) return '<span class="muted">none</span>';
    return `<a href="/dashboard/visitor/${encodeURIComponent(id)}"><code>${esc(id.slice(0, 8))}</code></a>`;
}

function ipLink(ip) {
    if (!ip) return '';
    return `<a href="/dashboard/ip/${encodeURIComponent(ip)}"><code>${esc(ip)}</code></a>`;
}

function eventRow(ev, showVisitor = true) {
    let extra = '';
    try {
        const d = JSON.parse(ev.data_json || '{}');
        if (ev.type === 'click') extra = esc((d.tag || '') + ' ' + (d.text || d.href || '')).slice(0, 80);
        else if (ev.type === 'scroll') extra = (d.depth || 0) + '%';
        else if (ev.type === 'exit' || ev.type === 'heartbeat') extra = fmtDur(d.timeOnPageMs) + (d.maxScroll != null ? ', scroll ' + d.maxScroll + '%' : '');
        else if (ev.type === 'lang') extra = esc(d.lang || '');
        else if (ev.type === 'error') extra = esc((d.message || '').slice(0, 80));
    } catch { /* ignore */ }
    return `<tr class="${ev.is_bot ? 'bot' : ''}">
<td class="muted" title="${esc(ev.ts)}">${esc(timeAgo(ev.ts))}</td>
<td>${esc(ev.type)}${ev.is_bot ? '<span class="tag">bot</span>' : ''}</td>
${showVisitor ? `<td>${visitorLink(ev.visitor_id)}</td>` : ''}
<td>${flagEmoji(ev.country)} ${esc([ev.city, ev.country].filter(Boolean).join(', '))}</td>
<td>${ipLink(ev.ip)}<br><span class="muted">${esc(ev.as_org || '')}</span></td>
<td>${esc(ev.browser || '')} ${esc((ev.browser_ver || '').split('.')[0])} / ${esc(ev.os || '')}<br><span class="muted">${esc(ev.device || '')} ${esc(ev.screen || '')}</span></td>
<td><code>${esc(ev.path || '')}</code>${ev.referrer ? `<br><span class="muted">from ${esc(ev.referrer).slice(0, 60)}</span>` : ''}</td>
<td>${extra}</td></tr>`;
}

const EVENT_HEAD = (showVisitor = true) => `<tr><th>When</th><th>Type</th>${showVisitor ? '<th>Visitor</th>' : ''}<th>Where</th><th>IP / network</th><th>Device</th><th>Page</th><th>Detail</th></tr>`;

function smallTable(rows, cols) {
    if (!rows.length) return '<p class="muted">Nothing yet.</p>';
    return `<table><tr>${cols.map(c => `<th>${esc(c.label)}</th>`).join('')}</tr>${rows.map(r => `<tr>${cols.map(c => `<td>${c.render ? c.render(r) : esc(r[c.key])}</td>`).join('')}</tr>`).join('')}</table>`;
}

export async function renderOverview(env, url) {
    const hours = Math.min(24 * 90, Math.max(1, parseInt(url.searchParams.get('hours') || '24', 10)));
    const o = await overview(env.DB, hours);
    const sel = [1, 6, 24, 72, 168, 720, 2160].map(h => `<option value="${h}" ${h === hours ? 'selected' : ''}>${h < 24 ? h + 'h' : (h / 24) + 'd'}</option>`).join('');
    const body = `
<p>Window: <form class="range" method="get" action="/dashboard"><select name="hours" onchange="this.form.submit()">${sel}</select></form>
<span class="muted">since ${esc(fmtTs(o.since))}</span></p>
<div class="cards">
<div class="card"><div class="n">${o.totals.pageviews || 0}</div><div class="l">page views (humans)</div></div>
<div class="card"><div class="n">${o.totals.visitors || 0}</div><div class="l">unique visitors</div></div>
<div class="card"><div class="n">${o.totals.sessions || 0}</div><div class="l">visits (sessions)</div></div>
<div class="card"><div class="n">${o.bots || 0}</div><div class="l">bot requests</div></div>
</div>
<div class="grid">
<div class="card"><h2>Top pages</h2>${smallTable(o.pages, [{ key: 'path', label: 'Page', render: r => `<code>${esc(r.path)}</code>` }, { key: 'n', label: 'Views' }, { key: 'v', label: 'Visitors' }])}</div>
<div class="card"><h2>Locations</h2>${smallTable(o.countries, [{ key: 'country', label: 'Place', render: r => `${flagEmoji(r.country)} ${esc([r.city, r.country].filter(Boolean).join(', ') || 'Unknown')}` }, { key: 'n', label: 'Views' }])}</div>
<div class="card"><h2>Referrers</h2>${smallTable(o.refs, [{ key: 'referrer', label: 'Referrer', render: r => esc(r.referrer).slice(0, 70) }, { key: 'n', label: 'Views' }])}</div>
<div class="card"><h2>Browsers</h2>${smallTable(o.browsers, [{ key: 'b', label: 'Browser / OS' }, { key: 'device', label: 'Device' }, { key: 'n', label: 'Views' }])}</div>
</div>
<div class="card"><h2>Recent events (${o.recent.length})</h2><div class="wrap"><table>${EVENT_HEAD()}${o.recent.map(e => eventRow(e)).join('')}</table></div></div>`;
    return layout('Overview', body, env);
}

export async function renderVisitors(env) {
    const rows = await listVisitors(env.DB, 300);
    const body = `<div class="card"><h2>Visitors (${rows.length} most recent)</h2><div class="wrap"><table>
<tr><th>Visitor</th><th>Last seen</th><th>First seen</th><th>Visits</th><th>Views</th><th>Last location</th><th>Last IP</th><th>Network</th></tr>
${rows.map(v => `<tr class="${v.is_bot ? 'bot' : ''}"><td>${visitorLink(v.id)}${v.is_bot ? '<span class="tag">bot</span>' : ''}</td><td title="${esc(v.last_seen)}">${esc(timeAgo(v.last_seen))}</td><td>${esc(fmtTs(v.first_seen))}</td><td>${v.visits}</td><td>${v.pageviews}</td>
<td>${flagEmoji(v.last_country)} ${esc([v.last_city, v.last_country].filter(Boolean).join(', '))}</td><td>${ipLink(v.last_ip)}</td><td>${esc(v.last_as_org || '')}</td></tr>`).join('')}
</table></div></div>`;
    return layout('Visitors', body, env);
}

export async function renderVisitor(env, id) {
    const { visitor, sessions, events } = await visitorDetail(env.DB, id);
    if (!visitor && !events.length) return layout('Visitor', '<p>No such visitor.</p>', env);
    let profile = {};
    try { profile = JSON.parse((visitor && visitor.profile_json) || '{}'); } catch { /* ignore */ }
    const v = visitor || {};
    const body = `
<p><a href="/dashboard">&larr; Overview</a></p>
<div class="grid">
<div class="card"><h2>Visitor <code>${esc(id)}</code></h2>
<dl>
<dt>First seen</dt><dd>${esc(fmtTs(v.first_seen))}</dd>
<dt>Last seen</dt><dd>${esc(fmtTs(v.last_seen))} <span class="muted">(${esc(timeAgo(v.last_seen))})</span></dd>
<dt>Visits / views</dt><dd>${v.visits || 0} / ${v.pageviews || 0}</dd>
<dt>First IP</dt><dd>${ipLink(v.first_ip)}</dd>
<dt>Last IP</dt><dd>${ipLink(v.last_ip)}</dd>
<dt>Last location</dt><dd>${flagEmoji(v.last_country)} ${esc([v.last_city, v.last_country].filter(Boolean).join(', '))}</dd>
<dt>Network</dt><dd>${esc(v.last_as_org || '')}</dd>
<dt>User agent</dt><dd class="muted">${esc(v.last_ua || '')}</dd>
<dt>Bot</dt><dd>${v.is_bot ? 'yes' : 'no'}</dd>
</dl></div>
<div class="card"><h2>Device profile (reported by browser)</h2><pre>${esc(JSON.stringify(profile, null, 2))}</pre></div>
</div>
<div class="card" style="margin-bottom:16px"><h2>Sessions (${sessions.length})</h2><div class="wrap"><table>
<tr><th>Started</th><th>Duration</th><th>Views</th><th>Entry</th><th>Exit</th><th>Referrer</th><th>Where</th><th>IP</th><th>Device</th></tr>
${sessions.map(s => `<tr><td>${esc(fmtTs(s.started_at))}</td><td>${fmtDur(s.duration_ms)}</td><td>${s.pageviews}</td><td><code>${esc(s.entry_page || '')}</code></td><td><code>${esc(s.exit_page || '')}</code></td><td class="muted">${esc((s.referrer || 'direct')).slice(0, 50)}</td>
<td>${flagEmoji(s.country)} ${esc([s.city, s.country].filter(Boolean).join(', '))}</td><td>${ipLink(s.ip)}</td><td>${esc(s.browser || '')} / ${esc(s.os || '')} ${esc(s.device || '')}</td></tr>`).join('')}
</table></div></div>
<div class="card"><h2>Events (${events.length})</h2><div class="wrap"><table>${EVENT_HEAD(false)}${events.map(e => eventRow(e, false)).join('')}</table></div>
<details style="margin-top:10px"><summary>Raw event data (latest 20)</summary><pre>${esc(JSON.stringify(events.slice(0, 20).map(e => ({ ...e, data_json: safeParse(e.data_json), headers_json: safeParse(e.headers_json) })), null, 2))}</pre></details></div>`;
    return layout('Visitor ' + id.slice(0, 8), body, env);
}

function safeParse(s) { try { return JSON.parse(s); } catch { return s; } }

export async function renderIp(env, ip) {
    const events = await eventsByIp(env.DB, ip);
    const visitors = [...new Set(events.map(e => e.visitor_id).filter(Boolean))];
    const body = `<p><a href="/dashboard">&larr; Overview</a></p>
<div class="card" style="margin-bottom:16px"><h2>IP <code>${esc(ip)}</code></h2>
<p>${events.length} events, ${visitors.length} visitor id(s): ${visitors.map(visitorLink).join(' ')}</p>
<p class="muted">Lookups: <a href="https://ipinfo.io/${encodeURIComponent(ip)}" target="_blank" rel="noopener">ipinfo</a> · <a href="https://www.abuseipdb.com/check/${encodeURIComponent(ip)}" target="_blank" rel="noopener">AbuseIPDB</a> · <a href="https://www.shodan.io/host/${encodeURIComponent(ip)}" target="_blank" rel="noopener">Shodan</a> · <a href="https://bgp.he.net/ip/${encodeURIComponent(ip)}" target="_blank" rel="noopener">HE BGP</a></p></div>
<div class="card"><div class="wrap"><table>${EVENT_HEAD()}${events.map(e => eventRow(e)).join('')}</table></div></div>`;
    return layout('IP ' + ip, body, env);
}

export async function renderCsv(env, url) {
    const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') || '30', 10)));
    const rows = await exportEvents(env.DB, days);
    if (!rows.length) return 'no data\n';
    const cols = Object.keys(rows[0]);
    const q = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return cols.join(',') + '\n' + rows.map(r => cols.map(c => q(r[c])).join(',')).join('\n') + '\n';
}
