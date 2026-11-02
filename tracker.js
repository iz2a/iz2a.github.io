/* ==========================================================================
   tracker.js
   Visitor analytics for aziz.life. Loaded on every page. Collects a
   persistent visitor id, session, page, referrer, UTM tags, screen and
   device info, clicks, scroll depth and time on page, and posts them to
   the Cloudflare Worker in /tracker. The Worker adds IP, geo and network
   data from the real connection server side and sends alerts.

   This is ordinary first-party analytics. It does not fingerprint the
   device to re-identify people who clear their cookies, and it does not
   try to unmask VPNs. A visitor who clears storage becomes a new visitor,
   as they should.
   ========================================================================== */
(function () {
    'use strict';

    // Set after deploying the Worker (see tracker/README.md). You can also
    // pass it inline: <script src="/tracker.js" data-endpoint="https://..."></script>
    var DEFAULT_ENDPOINT = 'https://aziz-tracker.YOUR_SUBDOMAIN.workers.dev/collect';

    var me = document.currentScript;
    var ENDPOINT = (me && me.getAttribute('data-endpoint')) || DEFAULT_ENDPOINT;
    if (!ENDPOINT || ENDPOINT.indexOf('YOUR_SUBDOMAIN') !== -1) return; // not configured yet

    // Respect an opt-out and Global Privacy Control / Do Not Track.
    try {
        if (window.localStorage.getItem('azl_optout') === '1') return;
        if (navigator.globalPrivacyControl === true) return;
    } catch (e) { /* storage blocked, carry on */ }

    var SESSION_GAP_MS = 30 * 60 * 1000;
    var HEARTBEAT_MS = 20000;
    var FLUSH_MS = 3000;

    // --- storage helpers ---------------------------------------------------
    function ls(k, v) {
        try { if (v === undefined) return window.localStorage.getItem(k); window.localStorage.setItem(k, v); return v; } catch (e) { return null; }
    }
    function ss(k, v) {
        try { if (v === undefined) return window.sessionStorage.getItem(k); window.sessionStorage.setItem(k, v); return v; } catch (e) { return null; }
    }
    function cookie(k, v, days) {
        if (v === undefined) {
            var m = document.cookie.match(new RegExp('(?:^|; )' + k + '=([^;]*)'));
            return m ? decodeURIComponent(m[1]) : null;
        }
        var exp = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = k + '=' + encodeURIComponent(v) + '; expires=' + exp + '; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
        return v;
    }
    function randomId(bytes) {
        var arr = new Uint8Array(bytes || 16);
        if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(arr);
        else for (var i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
        var s = '';
        for (var j = 0; j < arr.length; j++) s += ('0' + arr[j].toString(16)).slice(-2);
        return s;
    }

    // Persistent visitor id. A plain random id, stored in localStorage with a
    // cookie backup so it survives a tab close. Not derived from the device.
    var visitorId = ls('azl_vid') || cookie('azl_vid');
    if (!visitorId || !/^[a-f0-9]{16,64}$/.test(visitorId)) visitorId = randomId(16);
    ls('azl_vid', visitorId);
    cookie('azl_vid', visitorId, 730);

    // Session id, rotated after 30 minutes of inactivity.
    var now = Date.now();
    var sessionId = ss('azl_sid');
    var lastSeen = parseInt(ss('azl_last') || '0', 10);
    var sessionStart = parseInt(ss('azl_sstart') || '0', 10);
    if (!sessionId || !lastSeen || now - lastSeen > SESSION_GAP_MS) {
        sessionId = randomId(12);
        sessionStart = now;
        ss('azl_sid', sessionId);
        ss('azl_sstart', String(sessionStart));
    }
    ss('azl_last', String(now));

    // --- context -----------------------------------------------------------
    function getUtm() {
        var utm = {}, q;
        try { q = new URLSearchParams(location.search); } catch (e) { return null; }
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) {
            var v = q.get(k); if (v) utm[k] = v.slice(0, 200);
        });
        return Object.keys(utm).length ? utm : null;
    }

    function deviceInfo() {
        var d = {};
        try {
            d.screen = { w: screen.width, h: screen.height, dpr: window.devicePixelRatio || 1 };
            d.viewport = { w: window.innerWidth, h: window.innerHeight };
            d.languages = (navigator.languages && navigator.languages.slice(0, 5)) || (navigator.language ? [navigator.language] : []);
            d.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
            d.platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || null;
            d.mobile = (navigator.userAgentData && navigator.userAgentData.mobile) || /Mobi/.test(navigator.userAgent);
            d.touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
            d.referrerPage = document.referrer || null;
        } catch (e) { /* ignore */ }
        return d;
    }

    // --- sending -----------------------------------------------------------
    var queue = [];
    var flushTimer = null;

    function send(beacon, useBeaconApi) {
        var body = JSON.stringify(beacon);
        try {
            if (useBeaconApi && navigator.sendBeacon) {
                navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
                return;
            }
        } catch (e) { /* fall through to fetch */ }
        try {
            fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' }, body: body, keepalive: true, credentials: 'omit', mode: 'cors' }).catch(function () {});
        } catch (e) { /* give up quietly */ }
    }

    function base(type, data) {
        ss('azl_last', String(Date.now()));
        return {
            type: type,
            visitorId: visitorId,
            sessionId: sessionId,
            url: location.href,
            path: location.pathname + location.search,
            title: (document.title || '').slice(0, 300),
            referrer: document.referrer || null,
            utm: getUtm(),
            data: data || {}
        };
    }

    function enqueue(type, data, flushNow) {
        queue.push(base(type, data));
        if (flushNow) return flush(true);
        if (!flushTimer) flushTimer = setTimeout(function () { flush(false); }, FLUSH_MS);
    }

    function flush(useBeaconApi) {
        if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
        if (!queue.length) return;
        var events = queue.splice(0, queue.length);
        send(events.length === 1 ? events[0] : { events: events }, useBeaconApi);
    }

    // --- behaviour tracking ------------------------------------------------
    var pageStart = Date.now();
    var maxScroll = 0;
    var scrollTick = false;

    function scrollDepth() {
        var h = document.documentElement;
        var full = Math.max(h.scrollHeight, document.body.scrollHeight) - window.innerHeight;
        var pct = full <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / full) * 100));
        if (pct > maxScroll) {
            maxScroll = pct;
            if ([25, 50, 75, 90, 100].indexOf(pct) === -1) return;
            enqueue('scroll', { depth: pct });
        }
    }

    window.addEventListener('scroll', function () {
        if (scrollTick) return;
        scrollTick = true;
        setTimeout(function () { scrollTick = false; scrollDepth(); }, 400);
    }, { passive: true });

    document.addEventListener('click', function (e) {
        var el = e.target && e.target.closest ? e.target.closest('a, button, [data-track]') : null;
        if (!el) return;
        var data = {
            tag: el.tagName.toLowerCase(),
            text: (el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 120),
            href: el.getAttribute('href') || null,
            id: el.id || null,
            cls: (el.className && el.className.toString) ? el.className.toString().slice(0, 120) : null
        };
        if (data.href && /^https?:/i.test(data.href) && el.hostname && el.hostname !== location.hostname) data.outbound = true;
        enqueue('click', data, !!data.outbound); // flush immediately for outbound so it is not lost on navigation
    }, true);

    // Language switch hook: the site exposes changeLanguage(); report switches.
    if (typeof window.changeLanguage === 'function') {
        var origChange = window.changeLanguage;
        window.changeLanguage = function (lang) { try { enqueue('lang', { lang: lang }); } catch (e) {} return origChange.apply(this, arguments); };
    }

    window.addEventListener('error', function (ev) {
        enqueue('error', { message: (ev.message || '').slice(0, 300), source: (ev.filename || '').slice(0, 200), line: ev.lineno || null });
    });

    // Heartbeat so time-on-page is known even without an exit event.
    var heartbeat = setInterval(function () {
        if (document.visibilityState === 'visible') enqueue('heartbeat', snapshot());
    }, HEARTBEAT_MS);

    function snapshot() {
        return { timeOnPageMs: Date.now() - pageStart, maxScroll: maxScroll, sessionDurationMs: Date.now() - sessionStart };
    }

    function sendExit() {
        clearInterval(heartbeat);
        queue.push(base('exit', snapshot()));
        flush(true);
    }
    window.addEventListener('pagehide', sendExit);
    window.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(true); });

    // --- initial page view -------------------------------------------------
    enqueue('pageview', deviceInfo(), true);

    // Tiny opt-out hook for a privacy page: azlTracker.optOut() / optIn()
    window.azlTracker = {
        optOut: function () { ls('azl_optout', '1'); clearInterval(heartbeat); },
        optIn: function () { try { window.localStorage.removeItem('azl_optout'); } catch (e) {} },
        visitorId: visitorId
    };
})();
