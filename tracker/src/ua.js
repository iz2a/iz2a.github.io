// Small user agent parser. Good enough for alerts and the dashboard;
// the raw UA string is always stored alongside the parsed result.

const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|facebot|ia_archiver|mediapartners|adsbot|duckduck|yandex|baidu|sogou|exabot|semrush|ahrefs|mj12|dotbot|petalbot|applebot|headless|phantom|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|statuscake|site24x7|curl\/|wget\/|python-requests|python-urllib|go-http-client|okhttp|java\/|libwww|httpclient|scrapy|axios\/|node-fetch|postman|insomnia|discordbot|telegrambot|whatsapp|slackbot|twitterbot|linkedinbot|skypeuripreview|embedly|quora link preview|outbrain|pinterest|vkshare|w3c_validator|chrome-lighthouse|google-inspectiontool|google favicon|feedfetcher|bytespider|gptbot|chatgpt-user|ccbot|claudebot|anthropic-ai|perplexitybot|amazonbot|cohere-ai|dataforseo|screaming frog|netcraft|censys|shodan|masscan|zgrab|nmap|nikto|sqlmap/i;

export function isBotUA(ua) {
    if (!ua) return true; // no UA at all is never a normal browser
    return BOT_RE.test(ua);
}

function match(re, s) {
    const m = re.exec(s);
    return m ? m[1] : null;
}

export function parseUA(ua) {
    ua = ua || '';
    const out = { browser: 'Unknown', browserVersion: '', os: 'Unknown', osVersion: '', device: 'desktop', engine: '' };

    // OS
    if (/Windows NT 10\.0/.test(ua)) { out.os = 'Windows'; out.osVersion = '10/11'; }
    else if (/Windows NT 6\.3/.test(ua)) { out.os = 'Windows'; out.osVersion = '8.1'; }
    else if (/Windows NT 6\.2/.test(ua)) { out.os = 'Windows'; out.osVersion = '8'; }
    else if (/Windows NT 6\.1/.test(ua)) { out.os = 'Windows'; out.osVersion = '7'; }
    else if (/Windows/.test(ua)) { out.os = 'Windows'; }
    else if (/iPhone|iPad|iPod/.test(ua)) {
        out.os = 'iOS';
        out.osVersion = (match(/OS (\d+[_.]\d+(?:[_.]\d+)?)/, ua) || '').replace(/_/g, '.');
        out.device = /iPad/.test(ua) ? 'tablet' : 'mobile';
    }
    else if (/Android/.test(ua)) {
        out.os = 'Android';
        out.osVersion = match(/Android (\d+(?:\.\d+)*)/, ua) || '';
        out.device = /Mobile/.test(ua) ? 'mobile' : 'tablet';
    }
    else if (/CrOS/.test(ua)) { out.os = 'ChromeOS'; }
    else if (/Mac OS X/.test(ua)) {
        out.os = 'macOS';
        out.osVersion = (match(/Mac OS X (\d+[_.]\d+(?:[_.]\d+)?)/, ua) || '').replace(/_/g, '.');
        // iPadOS 13+ pretends to be a Mac; touch hints are checked client side
    }
    else if (/Linux/.test(ua)) { out.os = 'Linux'; }

    // Browser (order matters)
    let v;
    if ((v = match(/Edg(?:e|A|iOS)?\/(\d+(?:\.\d+)*)/, ua))) { out.browser = 'Edge'; out.browserVersion = v; }
    else if ((v = match(/OPR\/(\d+(?:\.\d+)*)/, ua)) || (v = match(/Opera\/(\d+(?:\.\d+)*)/, ua))) { out.browser = 'Opera'; out.browserVersion = v; }
    else if ((v = match(/SamsungBrowser\/(\d+(?:\.\d+)*)/, ua))) { out.browser = 'Samsung Internet'; out.browserVersion = v; }
    else if ((v = match(/Brave\/(\d+(?:\.\d+)*)/, ua))) { out.browser = 'Brave'; out.browserVersion = v; }
    else if ((v = match(/Vivaldi\/(\d+(?:\.\d+)*)/, ua))) { out.browser = 'Vivaldi'; out.browserVersion = v; }
    else if ((v = match(/YaBrowser\/(\d+(?:\.\d+)*)/, ua))) { out.browser = 'Yandex'; out.browserVersion = v; }
    else if ((v = match(/UCBrowser\/(\d+(?:\.\d+)*)/, ua))) { out.browser = 'UC Browser'; out.browserVersion = v; }
    else if ((v = match(/FxiOS\/(\d+(?:\.\d+)*)/, ua))) { out.browser = 'Firefox'; out.browserVersion = v; }
    else if ((v = match(/Firefox\/(\d+(?:\.\d+)*)/, ua))) { out.browser = 'Firefox'; out.browserVersion = v; }
    else if ((v = match(/CriOS\/(\d+(?:\.\d+)*)/, ua))) { out.browser = 'Chrome'; out.browserVersion = v; }
    else if ((v = match(/Chrome\/(\d+(?:\.\d+)*)/, ua))) { out.browser = 'Chrome'; out.browserVersion = v; }
    else if (/Safari\//.test(ua) && (v = match(/Version\/(\d+(?:\.\d+)*)/, ua))) { out.browser = 'Safari'; out.browserVersion = v; }
    else if ((v = match(/MSIE (\d+(?:\.\d+)*)/, ua)) || (/Trident\//.test(ua) && (v = match(/rv:(\d+(?:\.\d+)*)/, ua)))) { out.browser = 'Internet Explorer'; out.browserVersion = v; }
    else if (isBotUA(ua)) { out.browser = 'Bot'; out.browserVersion = (match(/^([A-Za-z0-9_-]+)/, ua) || ''); }

    if (/Gecko\/\d/.test(ua)) out.engine = 'Gecko';
    else if (/AppleWebKit\//.test(ua)) out.engine = /Chrome|CriOS|Edg|OPR/.test(ua) ? 'Blink' : 'WebKit';
    else if (/Trident\//.test(ua)) out.engine = 'Trident';

    if (out.device === 'desktop' && /Mobi/.test(ua)) out.device = 'mobile';
    if (/SmartTV|SMART-TV|Tizen|WebOS|AppleTV|GoogleTV/i.test(ua)) out.device = 'tv';

    return out;
}

export function shortBrowser(p) {
    const major = (p.browserVersion || '').split('.')[0];
    return p.browser + (major ? ' ' + major : '');
}

export function shortOS(p) {
    return p.os + (p.osVersion ? ' ' + p.osVersion : '');
}
