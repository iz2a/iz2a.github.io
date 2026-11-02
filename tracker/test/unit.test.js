import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUA, isBotUA, shortBrowser, shortOS } from '../src/ua.js';
import { networkHint } from '../src/enrich.js';
import { buildAlert, flagEmoji, timeAgo } from '../src/notify.js';

test('parseUA: Chrome on Windows', () => {
    const p = parseUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    assert.equal(p.browser, 'Chrome');
    assert.equal(p.os, 'Windows');
    assert.equal(p.device, 'desktop');
    assert.equal(shortBrowser(p), 'Chrome 124');
});

test('parseUA: Safari on iPhone is mobile', () => {
    const p = parseUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1');
    assert.equal(p.browser, 'Safari');
    assert.equal(p.os, 'iOS');
    assert.equal(p.device, 'mobile');
    assert.equal(shortOS(p), 'iOS 17.4');
});

test('parseUA: Edge detected before Chrome', () => {
    const p = parseUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0');
    assert.equal(p.browser, 'Edge');
});

test('parseUA: Android tablet vs phone', () => {
    const phone = parseUA('Mozilla/5.0 (Linux; Android 14; Pixel 8 Mobile) AppleWebKit/537.36 Chrome/124.0.0.0');
    assert.equal(phone.device, 'mobile');
    const tablet = parseUA('Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36');
    assert.equal(tablet.device, 'tablet');
});

test('isBotUA: catches crawlers and tools, passes real browsers', () => {
    assert.ok(isBotUA('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'));
    assert.ok(isBotUA('curl/8.4.0'));
    assert.ok(isBotUA('python-requests/2.31.0'));
    assert.ok(isBotUA('')); // empty UA
    assert.ok(isBotUA('facebookexternalhit/1.1'));
    assert.ok(!isBotUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'));
});

test('networkHint: datacenter, telco, plain', () => {
    assert.equal(networkHint('Amazon.com, Inc.'), 'datacenter/VPN?');
    assert.equal(networkHint('Saudi Telecom Company JSC'), 'mobile/telco');
    assert.equal(networkHint('Some Residential ISP LLC'), '');
});

test('flagEmoji: valid country, unknown', () => {
    assert.equal(flagEmoji('SA'), '🇸🇦');
    assert.equal(flagEmoji('US'), '🇺🇸');
    assert.equal(flagEmoji('XX'), '🌐');
    assert.equal(flagEmoji(null), '🌐');
});

test('timeAgo: formats relative time', () => {
    const now = Date.parse('2026-11-02T12:00:00Z');
    assert.equal(timeAgo('2026-11-02T11:59:30Z', now), '30s ago');
    assert.equal(timeAgo('2026-11-02T11:30:00Z', now), '30m ago');
    assert.equal(timeAgo('2026-11-02T06:00:00Z', now), '6h ago');
    assert.equal(timeAgo('2026-10-30T12:00:00Z', now), '3d ago');
});

test('buildAlert: new visitor, has headline and escapes html', () => {
    const event = { type: 'pageview', visitorId: 'abcdef0123456789', path: '/<script>', title: 'Home & Co', referrer: 'https://www.google.com/', utm: { utm_source: 'linkedin' }, data: { screen: { w: 1920, h: 1080, dpr: 2 }, languages: ['en', 'ar'], timezone: 'Asia/Riyadh' } };
    const enriched = {
        ip: '1.2.3.4', country: 'SA', region: 'Riyadh', city: 'Riyadh', postal: '11564', colo: 'JED',
        asn: 25019, asOrg: 'Saudi Telecom Company JSC', httpProtocol: 'HTTP/3', tlsVersion: 'TLSv1.3',
        isBot: false, parsed: parseUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36'), headers: {}
    };
    const alert = buildAlert({ event, enriched, visitor: null, isNewVisitor: true, isNewSession: true, env: { PUBLIC_URL: 'https://t.example.dev' } });
    assert.match(alert.html, /New visitor/);
    assert.match(alert.html, /Riyadh/);
    assert.match(alert.html, /AS25019/);
    assert.match(alert.html, /mobile\/telco/);
    assert.ok(!alert.html.includes('/<script>')); // path angle brackets escaped
    assert.match(alert.html, /&lt;script&gt;/);
    assert.match(alert.html, /visitor history/); // dashboard link present
    assert.ok(alert.plain.length > 0);
});

test('buildAlert: returning visitor shows visit count', () => {
    const event = { type: 'pageview', visitorId: 'abcdef0123456789', path: '/', data: {} };
    const enriched = { ip: '1.2.3.4', country: 'SA', city: 'Riyadh', asn: 1, asOrg: 'x', isBot: false, parsed: parseUA('Chrome/1'), headers: {} };
    const alert = buildAlert({ event, enriched, visitor: { visits: 3, last_seen: new Date(Date.now() - 86400000).toISOString() }, isNewVisitor: false, isNewSession: true, env: {} });
    assert.match(alert.html, /visit #4/);
});

test('buildAlert: bot gets bot headline', () => {
    const event = { type: 'pageview', visitorId: 'abcdef0123456789', path: '/', data: {} };
    const enriched = { ip: '66.249.1.1', country: 'US', city: '', asn: 15169, asOrg: 'Google LLC', isBot: true, parsed: parseUA('Googlebot/2.1'), headers: {} };
    const alert = buildAlert({ event, enriched, visitor: null, isNewVisitor: true, isNewSession: true, env: {} });
    assert.match(alert.html, /Bot hit/);
    assert.equal(alert.isBot, true);
});
