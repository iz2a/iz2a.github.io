/* ==========================================================================
   Raqib SIEM — application logic
   A small but real SIEM: an SPL-style search over an in-browser log store,
   an Offenses queue, a guided investigation with a MITRE-mapped timeline,
   and response actions that resolve the active intrusion and score the shift.
   ========================================================================== */
(function () {
    'use strict';
    const D = window.SOC;
    if (!D) { console.error('SOC data not loaded'); return; }

    const $ = (s, r) => (r || document).querySelector(s);
    const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const fmtTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const fmtClock = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const toast = (m, t) => (window.SX && window.SX.toast ? window.SX.toast(m, t) : null);

    const state = {
        offenses: JSON.parse(JSON.stringify(D.OFFENSES)),
        actionsByOffense: {},
        activeOffense: null,
        score: 0
    };
    /* revive Date fields lost to JSON copy */
    state.offenses.forEach((o, i) => { o.firstSeen = D.OFFENSES[i].firstSeen; o.lastSeen = D.OFFENSES[i].lastSeen; });
    D.OFFENSES.forEach((o) => { state.actionsByOffense[o.id] = []; });

    /* =====================================================================
       SEARCH LANGUAGE (pipe-delimited, Splunk-ish)
    ===================================================================== */
    function tokenizeStage(stage) {
        const out = []; let cur = ''; let q = false;
        for (const ch of stage.trim()) {
            if (ch === '"') { q = !q; continue; }
            if (ch === ' ' && !q) { if (cur) { out.push(cur); cur = ''; } continue; }
            cur += ch;
        }
        if (cur) out.push(cur);
        return out;
    }

    function matchTerm(rec, tok) {
        const m = tok.match(/^([a-zA-Z_]+)\s*(!=|>=|<=|=|>|<)\s*(.*)$/);
        if (!m) { return JSON.stringify(rec).toLowerCase().indexOf(tok.toLowerCase()) !== -1; }
        const field = m[1], op = m[2], rawVal = m[3];
        let val = rec[field];
        if (val == null && rec.extra) val = rec.extra[field];
        const target = rawVal.toLowerCase();
        const sval = String(val == null ? '' : val).toLowerCase();
        switch (op) {
            case '=':
                if (target.indexOf('*') !== -1) {
                    const re = new RegExp('^' + target.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
                    return re.test(sval);
                }
                return sval === target;
            case '!=': return sval !== target;
            case '>': return parseFloat(val) > parseFloat(rawVal);
            case '<': return parseFloat(val) < parseFloat(rawVal);
            case '>=': return parseFloat(val) >= parseFloat(rawVal);
            case '<=': return parseFloat(val) <= parseFloat(rawVal);
        }
        return false;
    }

    function runSearch(query) {
        const stages = query.split('|').map((s) => s.trim()).filter(Boolean);
        let rows = D.LOGS.slice();
        let agg = null;
        const isCmd = (s) => /^(stats|timechart|sort|head|tail)\b/.test(s);
        let start = 0;
        if (stages.length && !isCmd(stages[0])) {
            const toks = tokenizeStage(stages[0]);
            rows = rows.filter((r) => toks.every((t) => t === '*' || matchTerm(r, t)));
            start = 1;
        }
        for (let i = start; i < stages.length; i++) {
            const st = stages[i]; const cmd = st.split(/\s+/)[0];
            if (cmd === 'stats') {
                const by = (st.match(/by\s+([a-zA-Z_]+)/) || [])[1] || 'source';
                const counts = {};
                rows.forEach((r) => { const k = r[by] != null ? r[by] : (r.extra && r.extra[by]) || '(none)'; counts[k] = (counts[k] || 0) + 1; });
                agg = { type: 'stats', by, rows: Object.keys(counts).map((k) => ({ key: k, count: counts[k] })).sort((a, b) => b.count - a.count) };
            } else if (cmd === 'timechart') {
                const buckets = {};
                rows.forEach((r) => { const b = Math.floor((r.time - D.shiftStart) / (15 * 60000)); buckets[b] = (buckets[b] || 0) + 1; });
                agg = { type: 'timechart', rows: Object.keys(buckets).map((b) => ({ bucket: +b, count: buckets[b] })).sort((a, b) => a.bucket - b.bucket) };
            } else if (cmd === 'sort') {
                const f = st.replace(/^sort\s+/, '').trim(); const desc = f.startsWith('-'); const key = f.replace(/^-/, '');
                rows.sort((a, b) => { const x = a[key], y = b[key]; return (x > y ? 1 : x < y ? -1 : 0) * (desc ? -1 : 1); });
            } else if (cmd === 'head') { rows = rows.slice(0, parseInt(st.split(/\s+/)[1] || '10', 10)); }
            else if (cmd === 'tail') { rows = rows.slice(-parseInt(st.split(/\s+/)[1] || '10', 10)); }
        }
        return { rows, agg };
    }

    function renderSearch(query) {
        const out = $('#siem-results');
        let res;
        try { res = runSearch(query); }
        catch (e) { out.innerHTML = '<div class="siem-msg">Could not parse that search. Try <code>source=edr severity=critical</code>.</div>'; return; }
        $('#siem-count').textContent = res.rows.length.toLocaleString();

        if (res.agg && res.agg.type === 'stats') {
            const max = Math.max.apply(null, res.agg.rows.map((r) => r.count)) || 1;
            out.innerHTML = '<table class="siem-stats"><thead><tr><th>' + esc(res.agg.by) + '</th><th>count</th><th></th></tr></thead><tbody>' +
                res.agg.rows.map((r) => '<tr><td>' + esc(r.key) + '</td><td>' + r.count + '</td><td><span class="statbar" style="width:' + (r.count / max * 100) + '%"></span></td></tr>').join('') +
                '</tbody></table>';
            return;
        }
        if (res.agg && res.agg.type === 'timechart') {
            const max = Math.max.apply(null, res.agg.rows.map((r) => r.count)) || 1;
            out.innerHTML = '<div class="siem-timechart">' + res.agg.rows.map((r) => {
                const t = new Date(D.shiftStart.getTime() + r.bucket * 15 * 60000);
                return '<div class="tc-col" title="' + fmtClock(t) + ' — ' + r.count + '"><div class="tc-bar" style="height:' + Math.max(4, r.count / max * 120) + 'px"></div><div class="tc-lbl">' + fmtClock(t) + '</div></div>';
            }).join('') + '</div>';
            return;
        }
        if (!res.rows.length) { out.innerHTML = '<div class="siem-msg">No events match. Widen the search or remove a filter.</div>'; return; }
        const rows = res.rows.slice(0, 200).map((r) => {
            const sev = r.severity || 'info';
            return '<button class="ev" data-ev="' + r._id + '">' +
                '<span class="ev-time">' + fmtTime(r.time) + '</span>' +
                '<span class="ev-sev sev-' + sev + '">' + sev + '</span>' +
                '<span class="ev-src">' + esc(r.source) + '</span>' +
                '<span class="ev-host">' + esc(r.host) + '</span>' +
                '<span class="ev-msg">' + esc(r.msg) + '</span>' +
                (r.technique ? '<span class="ev-tech">' + esc(r.technique) + '</span>' : '') +
                '</button>';
        }).join('');
        out.innerHTML = '<div class="siem-rows">' + rows + (res.rows.length > 200 ? '<div class="siem-msg">Showing first 200 of ' + res.rows.length + ' events.</div>' : '') + '</div>';
        $$('.ev', out).forEach((b) => b.addEventListener('click', () => openEvent(b.dataset.ev)));
    }

    function openEvent(id) {
        const r = D.LOGS.find((e) => e._id === id);
        if (!r) return;
        const rows = [];
        const add = (k, v) => { if (v != null && v !== '') rows.push('<tr><td>' + esc(k) + '</td><td>' + esc(v) + '</td></tr>'); };
        add('_time', r.time.toLocaleString());
        add('severity', r.severity); add('source', r.source); add('action', r.action);
        add('host', r.host); add('ip', r.ip); add('user', r.user); add('signature', r.signature);
        if (r.technique) add('technique', r.technique + ' — ' + (D.TECHNIQUES[r.technique] || ''));
        if (r.extra) Object.keys(r.extra).forEach((k) => add(k, r.extra[k]));
        add('message', r.msg);
        const off = state.offenses.find((o) => o.eventIds.indexOf(id) !== -1);
        const modal = buildModal('Event ' + esc(r._id),
            '<table class="ev-detail">' + rows.join('') + '</table>' +
            (off ? '<div class="ev-linked">Part of offense <a href="#" data-goto="' + off.id + '">' + esc(off.id) + ' — ' + esc(off.title) + '</a></div>' : ''));
        const link = $('[data-goto]', modal);
        if (link) link.addEventListener('click', (e) => { e.preventDefault(); closeModal(); openOffense(off.id); });
    }

    function renderOffenses() {
        const open = state.offenses.filter((o) => o.status === 'open');
        const closed = state.offenses.filter((o) => o.status !== 'open');
        $('#of-open-count').textContent = open.length;
        const card = (o) => {
            const acts = state.actionsByOffense[o.id] || [];
            return '<button class="of-card sev-border-' + o.severity + (o.status !== 'open' ? ' is-closed' : '') + '" data-of="' + o.id + '">' +
                '<div class="of-top"><span class="of-mag sev-bg-' + o.severity + '">' + o.magnitude.toFixed(1) + '</span>' +
                '<div class="of-h"><div class="of-id">' + esc(o.id) + ' · ' + esc(o.category) + '</div><div class="of-title">' + esc(o.title) + '</div></div>' +
                '<span class="of-status st-' + o.status + '">' + esc(o.status) + '</span></div>' +
                '<div class="of-meta">' +
                '<span><i class="fas fa-desktop"></i> ' + esc(o.sourceHost) + '</span>' +
                '<span><i class="fas fa-layer-group"></i> ' + o.eventIds.length + ' events</span>' +
                '<span><i class="far fa-clock"></i> ' + fmtClock(o.firstSeen) + '–' + fmtClock(o.lastSeen) + '</span>' +
                (acts.length ? '<span class="of-actions-taken"><i class="fas fa-bolt"></i> ' + acts.length + ' actions</span>' : '') +
                '</div></button>';
        };
        $('#of-list').innerHTML = open.map(card).join('') || '<div class="siem-msg">No open offenses. Nice and quiet.</div>';
        $('#of-closed').innerHTML = closed.length ? ('<div class="of-closed-h">Closed this shift</div>' + closed.map(card).join('')) : '';
        $$('#of-list .of-card, #of-closed .of-card').forEach((b) => b.addEventListener('click', () => openOffense(b.dataset.of)));
    }

    function openOffense(id) {
        const o = state.offenses.find((x) => x.id === id);
        if (!o) return;
        state.activeOffense = id;
        switchView('investigate');
        renderInvestigation(o);
    }

    function renderInvestigation(o) {
        const wrap = $('#inv-body');
        const events = o.eventIds.map((id) => D.LOGS.find((e) => e._id === id)).filter(Boolean).sort((a, b) => a.time - b.time);
        const acts = state.actionsByOffense[o.id] || [];
        const techniques = o.techniques.map((t) => '<span class="tech-chip" title="' + esc(D.TECHNIQUES[t] || '') + '">' + esc(t) + '</span>').join('');

        const timeline = events.map((e) => {
            const sev = e.severity || 'info';
            return '<li class="tl-ev">' +
                '<span class="tl-dot sev-bg-' + sev + '"></span>' +
                '<div class="tl-card">' +
                '<div class="tl-when">' + fmtTime(e.time) + ' · <span class="tl-src">' + esc(e.source) + '</span> · ' + esc(e.host) + '</div>' +
                '<div class="tl-sig">' + esc(e.signature) + '</div>' +
                '<div class="tl-msg">' + esc(e.msg) + '</div>' +
                (e.technique ? '<div class="tl-tech">' + esc(e.technique) + ' · ' + esc(D.TECHNIQUES[e.technique] || '') + '</div>' : '') +
                '</div></li>';
        }).join('');

        const actionButtons = Object.keys(D.ACTIONS).map((key) => {
            const a = D.ACTIONS[key];
            const done = acts.indexOf(key) !== -1;
            return '<button class="act-btn' + (done ? ' is-done' : '') + '" data-act="' + key + '"' + (done ? ' disabled' : '') + '>' +
                '<i class="fas ' + a.icon + '"></i> ' + esc(a.label) + (done ? ' <i class="fas fa-check act-check"></i>' : '') + '</button>';
        }).join('');

        wrap.innerHTML =
            '<div class="inv-head">' +
                '<button class="inv-back" id="inv-back"><i class="fas fa-arrow-left"></i> Offenses</button>' +
                '<div class="inv-title-wrap"><span class="of-mag sev-bg-' + o.severity + '">' + o.magnitude.toFixed(1) + '</span>' +
                '<div><h2 class="inv-title">' + esc(o.title) + '</h2><div class="inv-sub">' + esc(o.id) + ' · ' + esc(o.category) + ' · source ' + esc(o.sourceHost) + ' (' + esc(o.sourceUser) + ')</div></div></div>' +
                '<span class="of-status st-' + o.status + '">' + esc(o.status) + '</span>' +
            '</div>' +
            '<div class="inv-grid">' +
                '<div class="inv-main">' +
                    '<div class="inv-summary">' + esc(o.summary) + '</div>' +
                    (techniques ? '<div class="inv-tech-row"><span class="inv-label">ATT&CK</span>' + techniques + '</div>' : '') +
                    '<div class="inv-tl-h"><i class="fas fa-bars-staggered"></i> Attack timeline (' + events.length + ' events)</div>' +
                    '<ol class="inv-timeline">' + timeline + '</ol>' +
                '</div>' +
                '<aside class="inv-side">' +
                    '<div class="inv-panel">' +
                        '<div class="inv-panel-h">Response actions</div>' +
                        '<p class="inv-hint">Contain first to stop the bleeding, then eradicate and escalate. Order is scored.</p>' +
                        '<div class="act-grid">' + actionButtons + '</div>' +
                    '</div>' +
                    (o.playbook ? '<div class="inv-panel"><div class="inv-panel-h">Playbook: ' + esc(D.PLAYBOOKS[o.playbook].name) + '</div><ol class="inv-playbook">' + D.PLAYBOOKS[o.playbook].steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol></div>' : '') +
                    '<div class="inv-panel"><div class="inv-panel-h">Action log</div><ul class="inv-log" id="inv-log">' + renderActionLog(o) + '</ul></div>' +
                '</aside>' +
            '</div>';

        $('#inv-back').addEventListener('click', () => { switchView('offenses'); });
        $$('.act-btn', wrap).forEach((b) => { if (!b.disabled) b.addEventListener('click', () => takeAction(o.id, b.dataset.act)); });
    }

    function renderActionLog(o) {
        const acts = state.actionsByOffense[o.id] || [];
        if (!acts.length) return '<li class="inv-log-empty">No actions taken yet.</li>';
        return acts.map((k, i) => '<li><span class="ilog-n">' + (i + 1) + '</span>' + esc(D.ACTIONS[k].label) + '</li>').join('');
    }

    function takeAction(offId, key) {
        const o = state.offenses.find((x) => x.id === offId);
        const acts = state.actionsByOffense[offId];
        if (acts.indexOf(key) !== -1) return;
        acts.push(key);
        const a = D.ACTIONS[key];
        toast(a.ok, (a.kind === 'contain' || a.kind === 'escalate' || a.kind === 'close') ? 'ok' : undefined);
        if (key === 'close') { finishOffense(o); return; }
        renderInvestigation(o);
        renderOffenses();
        updateHeaderStats();
        const rec = o.recommended.filter((r) => r !== 'close');
        const doneRec = rec.filter((r) => acts.indexOf(r) !== -1);
        if (doneRec.length === rec.length && o.status === 'open') {
            toast('All recommended actions complete. You can close ' + o.id + '.', 'ok');
        }
    }

    function finishOffense(o) {
        o.status = 'closed';
        const acts = state.actionsByOffense[o.id];
        const rec = o.recommended.filter((r) => r !== 'close');
        const hit = rec.filter((r) => acts.indexOf(r) !== -1).length;
        const extra = acts.filter((k) => k !== 'close' && rec.indexOf(k) === -1).length;
        let pts = hit * 20 - extra * 4;
        const firstContain = acts.findIndex((k) => D.ACTIONS[k].kind === 'contain');
        const firstErad = acts.findIndex((k) => D.ACTIONS[k].kind === 'eradicate');
        if (firstContain !== -1 && (firstErad === -1 || firstContain < firstErad)) pts += 15;
        pts = Math.max(0, pts);
        state.score += pts;
        const verdict = hit === rec.length
            ? 'Handled well. Every recommended action was taken' + (firstContain !== -1 && (firstErad === -1 || firstContain < firstErad) ? ', and you contained before eradicating.' : '.')
            : 'Closed with ' + hit + ' of ' + rec.length + ' recommended actions. Review the playbook for what was missed.';
        switchView('offenses');
        renderOffenses();
        updateHeaderStats();
        buildModal('Offense ' + esc(o.id) + ' closed',
            '<div class="verdict"><div class="verdict-score">+' + pts + ' pts</div>' +
            '<p>' + esc(verdict) + '</p>' +
            '<div class="verdict-detail"><strong>Recommended:</strong> ' + o.recommended.map((r) => (acts.indexOf(r) !== -1 || r === 'close' ? '<span class="v-ok">' + esc(D.ACTIONS[r].label) + '</span>' : '<span class="v-miss">' + esc(D.ACTIONS[r].label) + '</span>')).join(', ') + '</div>' +
            '</div>' +
            (state.offenses.every((x) => x.status !== 'open') ? '<p class="verdict-done">All offenses handled. Shift score: <strong>' + state.score + '</strong>. Generate your shift report from the Reports tab.</p>' : ''));
    }

    function renderDashboard() {
        const logs = D.LOGS;
        const bySev = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
        const bySrc = {};
        logs.forEach((l) => { bySev[l.severity] = (bySev[l.severity] || 0) + 1; bySrc[l.source] = (bySrc[l.source] || 0) + 1; });
        $('#db-total').textContent = logs.length.toLocaleString();
        $('#db-offenses').textContent = state.offenses.filter((o) => o.status === 'open').length;
        $('#db-crit').textContent = bySev.critical;
        const sevMax = Math.max.apply(null, Object.keys(bySev).map((k) => bySev[k])) || 1;
        $('#db-sev').innerHTML = ['critical', 'high', 'medium', 'low', 'info'].map((s) =>
            '<div class="db-bar-row"><span class="db-bar-lbl sev-' + s + '">' + s + '</span>' +
            '<span class="db-bar-track"><span class="db-bar sev-bg-' + s + '" style="width:' + (bySev[s] / sevMax * 100) + '%"></span></span>' +
            '<span class="db-bar-val">' + bySev[s] + '</span></div>').join('');
        const buckets = {};
        logs.forEach((l) => { const b = Math.floor((l.time - D.shiftStart) / (15 * 60000)); buckets[b] = (buckets[b] || 0) + 1; });
        const bkeys = Object.keys(buckets).map(Number).sort((a, b) => a - b);
        const bmax = Math.max.apply(null, bkeys.map((k) => buckets[k])) || 1;
        $('#db-timechart').innerHTML = bkeys.map((k) => {
            const t = new Date(D.shiftStart.getTime() + k * 15 * 60000);
            return '<div class="tc-col" title="' + fmtClock(t) + ' — ' + buckets[k] + ' events"><div class="tc-bar" style="height:' + Math.max(4, buckets[k] / bmax * 120) + 'px"></div><div class="tc-lbl">' + fmtClock(t) + '</div></div>';
        }).join('');
        const srcMax = Math.max.apply(null, Object.keys(bySrc).map((k) => bySrc[k])) || 1;
        $('#db-src').innerHTML = Object.keys(bySrc).sort((a, b) => bySrc[b] - bySrc[a]).map((s) =>
            '<div class="db-src-item"><div class="db-src-val">' + bySrc[s] + '</div><div class="db-src-lbl">' + esc(s) + '</div>' +
            '<div class="db-src-track"><span style="width:' + (bySrc[s] / srcMax * 100) + '%"></span></div></div>').join('');
    }

    function renderPlaybooks() {
        $('#pb-body').innerHTML = '<table class="siem-table"><thead><tr><th>Playbook</th><th>Category</th><th>Updated</th><th>Status</th></tr></thead><tbody>' +
            D.REFERENCE_PLAYBOOKS.map((p) => '<tr><td>' + esc(p.name) + '</td><td>' + esc(p.category) + '</td><td>' + esc(p.updated) + '</td><td><span class="pill pill-' + p.status + '">' + esc(p.status) + '</span></td></tr>').join('') +
            '</tbody></table>';
    }

    function renderReports() {
        const done = state.offenses.filter((o) => o.status !== 'open');
        const open = state.offenses.filter((o) => o.status === 'open');
        $('#rep-body').innerHTML =
            '<div class="rep-actions"><button class="sx-btn sx-btn--primary sx-btn--sm" id="rep-gen"><i class="fas fa-file-lines"></i> Generate shift report</button></div>' +
            '<div class="rep-summary">' +
                '<div class="rep-stat"><div class="rep-n">' + D.LOGS.length.toLocaleString() + '</div><div class="rep-l">events ingested</div></div>' +
                '<div class="rep-stat"><div class="rep-n">' + state.offenses.length + '</div><div class="rep-l">offenses raised</div></div>' +
                '<div class="rep-stat"><div class="rep-n">' + done.length + '</div><div class="rep-l">closed</div></div>' +
                '<div class="rep-stat"><div class="rep-n">' + state.score + '</div><div class="rep-l">shift score</div></div>' +
            '</div>' +
            (open.length ? '<p class="siem-msg">' + open.length + ' offense(s) still open. Close them from the Offenses tab for a complete report.</p>' : '<p class="siem-msg">All offenses handled.</p>');
        $('#rep-gen').addEventListener('click', generateReport);
    }

    function generateReport() {
        const lines = [];
        lines.push('GULFPAY SOC — SHIFT REPORT');
        lines.push('Analyst: ' + D.ORG.analyst + '   Generated: ' + new Date().toLocaleString());
        lines.push('Shift start: ' + D.shiftStart.toLocaleString());
        lines.push(''.padEnd(60, '='));
        lines.push('Events ingested: ' + D.LOGS.length);
        lines.push('Offenses raised: ' + state.offenses.length);
        lines.push('Shift score:     ' + state.score);
        lines.push('');
        state.offenses.forEach((o) => {
            lines.push('[' + o.id + '] ' + o.title);
            lines.push('  Severity: ' + o.severity + '  Magnitude: ' + o.magnitude + '  Status: ' + o.status);
            lines.push('  Window:   ' + fmtClock(o.firstSeen) + '-' + fmtClock(o.lastSeen) + '  Events: ' + o.eventIds.length);
            lines.push('  ATT&CK:   ' + (o.techniques.join(', ') || 'n/a'));
            const acts = state.actionsByOffense[o.id];
            lines.push('  Actions:  ' + (acts.length ? acts.map((k) => D.ACTIONS[k].label).join('; ') : 'none'));
            lines.push('  Summary:  ' + o.summary);
            lines.push('');
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'gulfpay-soc-shift-report.txt';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        toast('Shift report downloaded.', 'ok');
    }

    function updateHeaderStats() {
        const open = state.offenses.filter((o) => o.status === 'open');
        $('#hdr-offenses').textContent = open.length;
        $('#hdr-critical').textContent = open.filter((o) => o.severity === 'critical').length;
        $('#hdr-score').textContent = state.score;
        const badge = $('#nav-of-badge');
        if (badge) { badge.textContent = open.length; badge.style.display = open.length ? '' : 'none'; }
    }
    function tickClock() {
        const el = $('#siem-clock');
        if (el) el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    }

    function switchView(name) {
        $$('.siem-view').forEach((v) => v.classList.toggle('is-active', v.dataset.view === name));
        $$('.siem-tab').forEach((t) => t.classList.toggle('is-active', t.dataset.tab === name));
        if (name === 'dashboard') renderDashboard();
        if (name === 'offenses') renderOffenses();
        if (name === 'reports') renderReports();
        if (name === 'search') $('#siem-q').focus();
    }

    function buildModal(title, html) {
        closeModal();
        const back = document.createElement('div');
        back.className = 'siem-modal-back'; back.id = 'siem-modal';
        back.innerHTML = '<div class="siem-modal" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
            '<div class="siem-modal-h"><h3>' + esc(title) + '</h3><button class="siem-modal-x" aria-label="Close">&times;</button></div>' +
            '<div class="siem-modal-b">' + html + '</div></div>';
        document.body.appendChild(back);
        back.addEventListener('click', (e) => { if (e.target === back) closeModal(); });
        $('.siem-modal-x', back).addEventListener('click', closeModal);
        document.addEventListener('keydown', escClose);
        return back;
    }
    function closeModal() { const m = $('#siem-modal'); if (m) m.remove(); document.removeEventListener('keydown', escClose); }
    function escClose(e) { if (e.key === 'Escape') closeModal(); }

    const SAVED = [
        { label: 'All critical events', q: 'severity=critical' },
        { label: 'EDR process activity', q: 'source=edr action=process' },
        { label: 'Traffic to C2', q: '185.225.19.44' },
        { label: 'Failed VPN logins', q: 'source=auth action=failure' },
        { label: 'Events on FIN-WS03', q: 'host=FIN-WS03 | sort time' },
        { label: 'Count by source', q: '* | stats count by source' },
        { label: 'Count by severity', q: 'severity!=info | stats count by severity' },
        { label: 'Volume over time', q: '* | timechart' }
    ];

    function boot() {
        $('#siem-saved').innerHTML = SAVED.map((s) => '<button class="saved-q" data-q="' + esc(s.q) + '">' + esc(s.label) + '</button>').join('');
        $$('#siem-saved .saved-q').forEach((b) => b.addEventListener('click', () => { $('#siem-q').value = b.dataset.q; renderSearch(b.dataset.q); }));
        $('#siem-run').addEventListener('click', () => renderSearch($('#siem-q').value));
        $('#siem-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); renderSearch($('#siem-q').value); } });
        $$('.siem-tab').forEach((t) => t.addEventListener('click', () => switchView(t.dataset.tab)));
        renderPlaybooks();
        renderSearch('severity=critical');
        renderOffenses();
        updateHeaderStats();
        tickClock(); setInterval(tickClock, 1000);
        toast('New shift started. Three offenses are open — start with the critical one.', 'warn');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
