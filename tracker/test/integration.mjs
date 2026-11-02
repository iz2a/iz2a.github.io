// Standalone integration test: drives the Worker's fetch handler with a mocked
// D1 binding. Run with: node test/integration.mjs
import worker from '../src/index.js';

function makeDB() {
  const store = { events: [], visitors: new Map(), sessions: new Map() };
  function stmt(sql) {
    return {
      sql, args: [],
      bind(...a) { this.args = a; return this; },
      async first() {
        if (/FROM visitors WHERE id/.test(sql)) return store.visitors.get(this.args[0]) || null;
        if (/FROM sessions WHERE id/.test(sql)) return store.sessions.get(this.args[0]) || null;
        if (/COUNT\(\*\) AS pageviews/.test(sql)) return { pageviews: store.events.filter(e => e.type === 'pageview').length, visitors: 1, sessions: 1 };
        if (/COUNT\(\*\) AS n FROM events WHERE is_bot/.test(sql)) return { n: 0 };
        return null;
      },
      async all() {
        if (/ORDER BY ts DESC LIMIT 200/.test(sql)) return { results: store.events.slice(-200).reverse() };
        return { results: [] };
      },
      async run() { return { success: true }; }
    };
  }
  return {
    _store: store,
    prepare: (sql) => stmt(sql),
    async batch(stmts) {
      for (const s of stmts) {
        if (/INSERT INTO events/.test(s.sql)) {
          store.events.push({ ts: s.args[0], type: s.args[1], visitor_id: s.args[2], session_id: s.args[3], path: s.args[5], title: s.args[6], ip: s.args[9], country: s.args[10], city: s.args[12], browser: s.args[23], os: s.args[26], device: s.args[27], is_bot: s.args[30], data_json: s.args[31] });
        }
        if (/INSERT INTO visitors/.test(s.sql)) store.visitors.set(s.args[0], { id: s.args[0], first_seen: s.args[1], last_seen: s.args[2], visits: s.args[3], pageviews: s.args[4], last_ip: s.args[6], last_country: s.args[7], last_city: s.args[8], is_bot: s.args[11] });
        if (/INSERT OR IGNORE INTO sessions/.test(s.sql)) store.sessions.set(s.args[0], { id: s.args[0] });
      }
      return [];
    }
  };
}

const env = { DB: makeDB(), ALLOWED_ORIGINS: 'https://aziz.life,http://localhost:8080', SITE_NAME: 'aziz.life', DASHBOARD_USER: 'aziz', DASHBOARD_PASSWORD: 'testpass', NOTIFY_BOTS: 'false', PUBLIC_URL: 'https://t.example.dev' };
const tasks = [];
const ctx = { waitUntil: (p) => tasks.push(p) };
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.log('  FAIL:', m); } }

function req(url, opt = {}) {
  const r = new Request(url, { method: opt.method || 'GET', headers: new Headers(opt.headers || {}), body: opt.body });
  r.cf = { country: 'SA', region: 'Riyadh', city: 'Riyadh', postalCode: '11564', asn: 25019, asOrganization: 'Saudi Telecom Company JSC', colo: 'JED', httpProtocol: 'HTTP/3', tlsVersion: 'TLSv1.3', latitude: '24.7', longitude: '46.7', timezone: 'Asia/Riyadh' };
  return r;
}

let res = await worker.fetch(req('https://t.example.dev/collect', { method: 'OPTIONS', headers: { origin: 'https://aziz.life' } }), env, ctx);
ok(res.status === 204, 'preflight allowed origin -> 204, got ' + res.status);
ok(res.headers.get('access-control-allow-origin') === 'https://aziz.life', 'CORS echoes origin');

res = await worker.fetch(req('https://t.example.dev/collect', { method: 'POST', headers: { origin: 'https://evil.com', 'content-type': 'application/json' }, body: '{"type":"pageview"}' }), env, ctx);
ok(res.status === 403, 'disallowed origin -> 403, got ' + res.status);

const beacon = JSON.stringify({ type: 'pageview', visitorId: 'abcdef0123456789', sessionId: 'bbbbbbbbbbbb', path: '/', title: 'Home', referrer: 'https://www.google.com/', data: { screen: { w: 1920, h: 1080, dpr: 2 }, languages: ['en', 'ar'], timezone: 'Asia/Riyadh' } });
res = await worker.fetch(req('https://t.example.dev/collect', { method: 'POST', headers: { origin: 'https://aziz.life', 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36', 'cf-connecting-ip': '1.2.3.4' }, body: beacon }), env, ctx);
ok(res.status === 204, 'valid beacon -> 204, got ' + res.status);
await Promise.all(tasks);
ok(env.DB._store.events.length === 1, 'event stored, count=' + env.DB._store.events.length);
ok(env.DB._store.events[0].country === 'SA', 'event has CF country');
ok(env.DB._store.events[0].browser === 'Chrome', 'UA parsed to Chrome');
ok(env.DB._store.visitors.size === 1, 'visitor row created');

res = await worker.fetch(req('https://t.example.dev/collect', { method: 'POST', headers: { origin: 'https://aziz.life', 'content-type': 'application/json' }, body: 'not json' }), env, ctx);
ok(res.status === 400, 'bad json -> 400, got ' + res.status);

res = await worker.fetch(req('https://t.example.dev/dashboard'), env, ctx);
ok(res.status === 401, 'dashboard no auth -> 401, got ' + res.status);

res = await worker.fetch(req('https://t.example.dev/dashboard', { headers: { authorization: 'Basic ' + Buffer.from('aziz:wrong').toString('base64') } }), env, ctx);
ok(res.status === 401, 'dashboard wrong pw -> 401, got ' + res.status);

res = await worker.fetch(req('https://t.example.dev/dashboard', { headers: { authorization: 'Basic ' + Buffer.from('aziz:testpass').toString('base64') } }), env, ctx);
ok(res.status === 200, 'dashboard auth -> 200, got ' + res.status);
const body = await res.text();
ok(body.includes('visitor tracker') && body.includes('Recent events'), 'dashboard HTML renders');
ok(res.headers.get('x-robots-tag') === 'noindex', 'dashboard noindex');

const botBeacon = JSON.stringify({ type: 'pageview', visitorId: 'cccccccccccccccc', sessionId: 'dddddddddddd', path: '/', data: {} });
res = await worker.fetch(req('https://t.example.dev/collect', { method: 'POST', headers: { origin: 'https://aziz.life', 'content-type': 'application/json', 'user-agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)', 'cf-connecting-ip': '66.249.1.1' }, body: botBeacon }), env, ctx);
await Promise.all(tasks);
ok(res.status === 204, 'bot beacon -> 204');
ok(env.DB._store.events.some(e => e.is_bot === 1), 'bot event flagged is_bot');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
