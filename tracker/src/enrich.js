// Pull everything useful off the incoming request: client IP, Cloudflare
// geo and network data, and the request headers that describe the client.

import { parseUA, isBotUA } from './ua.js';

const HEADERS_OF_INTEREST = [
    'user-agent', 'accept', 'accept-language', 'accept-encoding', 'referer', 'origin',
    'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform', 'sec-ch-ua-platform-version',
    'sec-ch-ua-arch', 'sec-ch-ua-model', 'sec-ch-ua-full-version-list', 'sec-ch-ua-bitness',
    'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest', 'sec-gpc', 'dnt',
    'save-data', 'device-memory', 'viewport-width', 'width', 'downlink', 'ect', 'rtt',
    'x-forwarded-for', 'x-real-ip', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor',
    'via', 'forwarded', 'x-forwarded-proto'
];

export function enrichRequest(request) {
    const cf = request.cf || {};
    const h = request.headers;
    const ua = h.get('user-agent') || '';
    const parsed = parseUA(ua);

    const headers = {};
    for (const name of HEADERS_OF_INTEREST) {
        const v = h.get(name);
        if (v) headers[name] = v;
    }

    const ip = h.get('cf-connecting-ip') || (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || '';

    return {
        ip,
        ipVersion: ip.includes(':') ? 6 : (ip ? 4 : null),
        country: cf.country || h.get('cf-ipcountry') || null,
        region: cf.region || null,
        regionCode: cf.regionCode || null,
        city: cf.city || null,
        postal: cf.postalCode || null,
        lat: cf.latitude ? Number(cf.latitude) : null,
        lon: cf.longitude ? Number(cf.longitude) : null,
        timezone: cf.timezone || null,
        continent: cf.continent || null,
        isEU: cf.isEUCountry === '1',
        asn: cf.asn || null,
        asOrg: cf.asOrganization || null,
        colo: cf.colo || null,
        httpProtocol: cf.httpProtocol || null,
        tlsVersion: cf.tlsVersion || null,
        tlsCipher: cf.tlsCipher || null,
        // Present only on plans with Bot Management; harmless when missing
        botScore: cf.botManagement ? cf.botManagement.score : null,
        verifiedBot: cf.botManagement ? !!cf.botManagement.verifiedBot : null,
        ja3: cf.botManagement && cf.botManagement.ja3Hash ? cf.botManagement.ja3Hash : null,
        ja4: cf.botManagement && cf.botManagement.ja4 ? cf.botManagement.ja4 : null,
        ua,
        parsed,
        isBot: isBotUA(ua),
        headers
    };
}

// Rough network type guess from the AS organisation name. Not authoritative,
// just a useful hint in alerts.
export function networkHint(asOrg) {
    if (!asOrg) return '';
    const s = asOrg.toLowerCase();
    if (/amazon|aws|google cloud|gcp|microsoft|azure|digitalocean|linode|akamai|hetzner|ovh|vultr|oracle|alibaba|tencent|cloudflare|fastly|leaseweb|contabo|scaleway|m247|datacamp|choopa|hostinger|godaddy|namecheap|hostgator|ionos|server|hosting|datacenter|data center|cloud/.test(s)) return 'datacenter/VPN?';
    if (/mobily|zain|stc|saudi telecom|vodafone|orange|t-mobile|verizon|at&t|etisalat|du |ooredoo|turkcell|jio|airtel|mtn|mobile|cellular|wireless/.test(s)) return 'mobile/telco';
    if (/university|college|school|edu/.test(s)) return 'education';
    if (/gov|ministry|municipal/.test(s)) return 'government';
    return '';
}
