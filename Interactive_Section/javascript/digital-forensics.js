/* ==========================================================================
   Digital Forensics Simulation (2026, case files edition)
   Runs the five DFIR cases defined in digital-forensics-cases.js, from
   Level 1 (Trainee) to Level 5 (Lead Investigator).

   Every case follows the real workflow:
     1. Acquire each evidence source and record it in the chain of custody
        (with a real SHA-256 computed in the browser).
     2. Examine the artifacts, search across them and tag what matters to the
        evidence board.
     3. Work the case-specific stages: rebuild a timeline, judge which records
        the suspect altered, or trace bitcoin on a block explorer.
     4. State your conclusions and get a scored debrief.
   Harder levels add new skills, decoys and costlier hints. Progress is kept in
   this browser; solving every case unlocks the completion certificate.
   Modeled on real tools: Autopsy, FTK Imager, Volatility, Cellebrite-style
   extractions, EvtxECmd, Microsoft 365 audit search and blockchain explorers.
   ========================================================================== */
(function () {
    'use strict';
    function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    function nowStamp() {
        var d = new Date();
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }
    function shortAddr(a) { return a.slice(0, 9) + '…' + a.slice(-6); }
    function btc(v) { return v.toFixed(4) + ' BTC'; }

    var CASES = window.DF_CASES || [];
    var LEVEL_NAMES = ['', 'Trainee', 'Analyst', 'Senior Analyst', 'Expert', 'Lead Investigator'];

    /* ---------- hashing for the chain of custody ---------- */
    function fallbackHash(text) {
        // FNV-1a based 256-bit style digest for browsers without WebCrypto (e.g. file://)
        var out = '', h = 2166136261;
        for (var r = 0; r < 8; r++) {
            for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i) + r; h = Math.imul ? Math.imul(h, 16777619) >>> 0 : (h * 16777619) >>> 0; }
            out += ('0000000' + h.toString(16)).slice(-8);
        }
        return out;
    }
    function sha256(text) {
        try {
            if (window.crypto && window.crypto.subtle && window.TextEncoder) {
                return window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
                    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
                }).catch(function () { return fallbackHash(text); });
            }
        } catch (e) {}
        return Promise.resolve(fallbackHash(text));
    }

    /* ---------- progress (this browser only) ---------- */
    var PKEY = 'df.progress.v1';
    function loadProgress() { try { return JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; } catch (e) { return {}; } }
    function saveProgress(p) { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} }
    var progress = loadProgress();

    /* ---------- per-case working state ---------- */
    var states = {};
    function seededShuffle(list, seed) {
        var a = list.slice(), x = seed || 7;
        for (var i = a.length - 1; i > 0; i--) { x = (x * 48271) % 2147483647; var j = x % (i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; }
        // never start already in the right order
        if (a.join() === list.join()) a.reverse();
        return a;
    }
    function freshState(c) {
        var s = { acquired: {}, acqOrder: [], custody: [], acqBad: {}, acqFixed: {}, acqChoice: null,
                  tagged: {}, openEv: null, integrity: {}, flags: {}, trail: [], answers: {}, hints: {},
                  submitted: null, revealed: false, order: {} };
        (c.stages || []).forEach(function (stg) {
            if (stg.type === 'timeline') s.order[stg.id] = seededShuffle(stg.events.map(function (e) { return e.id; }), c.level * 131 + 17);
            if (stg.type === 'trace') s.trail = [stg.start];
        });
        return s;
    }
    function S(c) { return states[c.id] || (states[c.id] = freshState(c)); }

    var cur = null; // the case on screen

    function allArtifacts(c) {
        var out = [];
        c.evidence.forEach(function (e) { e.groups.forEach(function (g) { g.items.forEach(function (it) { out.push({ art: it, ev: e, group: g }); }); }); });
        return out;
    }
    function findArtifact(c, id) { var all = allArtifacts(c); for (var i = 0; i < all.length; i++) { if (all[i].art.id === id) return all[i]; } return null; }
    function findEv(c, id) { for (var i = 0; i < c.evidence.length; i++) { if (c.evidence[i].id === id) return c.evidence[i]; } return null; }
    function caseIndex(c) { return CASES.indexOf(c); }

    /* ================================================================== */
    ready(function () {
        if (!$('#df-app') || !CASES.length) return;
        var fromHash = (location.hash.match(/case-([a-z]+)/) || [])[1];
        var start = CASES.filter(function (c) { return c.id === fromHash; })[0] ||
                    CASES.filter(function (c) { return !(progress[c.id] && progress[c.id].solved); })[0] || CASES[0];
        cur = start;
        renderPicker();
        renderCase(false);
        updateCertificate();
    });

    /* ---------- case picker ---------- */
    function renderPicker() {
        var solved = CASES.filter(function (c) { return progress[c.id] && progress[c.id].solved; }).length;
        $('#df-progress').innerHTML =
            '<div class="df-progress-bar"><span style="width:' + Math.round(solved / CASES.length * 100) + '%"></span></div>' +
            '<div class="df-progress-t"><b>' + solved + ' of ' + CASES.length + '</b> cases solved' +
            (solved === CASES.length ? ' &middot; certificate unlocked below' : ' &middot; solve them all to earn the certificate') + '</div>';
        $('#df-cases').innerHTML = CASES.map(function (c) {
            var p = progress[c.id] || {};
            var on = cur && cur.id === c.id;
            var stars = p.best >= 90 ? 3 : p.best >= 75 ? 2 : p.best >= 60 ? 1 : 0;
            var status = p.solved ? '<span class="df-cstatus ok"><i class="fas fa-circle-check"></i> Solved &middot; ' + p.best + '/100</span>'
                : (p.best != null ? '<span class="df-cstatus warn"><i class="fas fa-rotate"></i> Best ' + p.best + '/100, not solved</span>'
                : (states[c.id] && Object.keys(states[c.id].acquired).length ? '<span class="df-cstatus"><i class="fas fa-play"></i> In progress</span>' : '<span class="df-cstatus"><i class="far fa-circle"></i> Not started</span>'));
            var dots = ''; for (var i = 1; i <= 5; i++) dots += '<i class="df-dot' + (i <= c.level ? ' on' : '') + '"></i>';
            return '<button class="df-case' + (on ? ' active' : '') + (p.solved ? ' solved' : '') + '" data-c="' + c.id + '" aria-pressed="' + on + '">' +
                '<span class="df-case-top"><span class="df-level">Level ' + c.level + ' &middot; ' + esc(c.rank) + '</span><span class="df-dots" aria-label="Difficulty ' + c.level + ' of 5">' + dots + '</span></span>' +
                '<span class="df-case-title">' + esc(c.title) + '</span>' +
                '<span class="df-case-teaser">' + esc(c.teaser) + '</span>' +
                '<span class="df-case-skills">' + c.skills.map(function (k) { return '<span>' + esc(k) + '</span>'; }).join('') + '</span>' +
                '<span class="df-case-foot">' + status + (stars ? '<span class="df-stars" aria-label="' + stars + ' stars">' + new Array(stars + 1).join('<i class="fas fa-star"></i>') + '</span>' : '') + '</span>' +
                '</button>';
        }).join('');
        $$('#df-cases .df-case').forEach(function (b) {
            b.addEventListener('click', function () {
                var c = CASES.filter(function (x) { return x.id === b.dataset.c; })[0];
                if (!c) return;
                cur = c; renderPicker(); renderCase(true);
            });
        });
    }

    /* ---------- one case ---------- */
    function stepCount(c) { return 3 + (c.stages || []).length; }

    function hintBox(c, key) {
        if (!c.hints || !c.hints[key]) return '';
        var s = S(c), cost = c.hintCost || 0;
        if (cost === 0 || s.hints[key]) return '<div class="df-hint" id="df-hint-' + key + '"><i class="fas fa-lightbulb"></i> <span>' + esc(c.hints[key]) + '</span></div>';
        return '<div class="df-hint is-locked" id="df-hint-' + key + '"><button class="df-hint-btn" data-h="' + key + '"><i class="fas fa-lightbulb"></i> Show a hint <small>(costs ' + cost + ' points)</small></button></div>';
    }
    function wireHints(c) {
        $$('#df-case .df-hint-btn').forEach(function (b) {
            b.addEventListener('click', function () {
                S(c).hints[b.dataset.h] = true;
                var box = $('#df-hint-' + b.dataset.h);
                if (box) { box.outerHTML = hintBox(c, b.dataset.h); }
            });
        });
    }

    function renderCase(scroll) {
        var c = cur, s = S(c), n = 2;
        try { history.replaceState(null, '', '#case-' + c.id); } catch (e) {}
        var html = '';
        html += '<div class="df-brief">' +
            '<div class="df-brief-top"><div class="df-brief-h"><i class="fas fa-folder-open"></i> Case file &middot; ' + esc(c.caseNo) + '</div>' +
            '<span class="df-brief-level">Level ' + c.level + ' &middot; ' + esc(c.rank) + '</span></div>' +
            '<h2 class="df-brief-title">' + esc(c.title) + '</h2>' +
            '<p>' + esc(c.brief) + '</p>' +
            '<div class="df-people-h">' + esc(c.peopleLabel || 'People involved') + '</div>' +
            '<div class="df-suspects">' + c.people.map(function (p) {
                return '<div class="df-suspect"><i class="fas fa-user"></i><div><b>' + esc(p.name) + '</b><span>' + esc(p.role) + ' &middot; ' + esc(p.note) + '</span></div></div>';
            }).join('') + '</div>' +
            '<div class="df-brief-actions"><button class="df-linkbtn" id="df-restart"><i class="fas fa-rotate-left"></i> Restart this case</button>' +
            (c.hintCost === 0 ? '<span class="df-brief-note"><i class="fas fa-lightbulb"></i> Hints are free at this level.</span>' : '<span class="df-brief-note"><i class="fas fa-lightbulb"></i> Hints cost ' + c.hintCost + ' points each at this level.</span>') +
            '</div></div>';

        // 1 acquire
        html += '<h2 class="df-step"><span>1</span> Acquire the evidence</h2>' +
            '<p class="df-steptext">Image each source and verify its hash before you examine it, and every acquisition goes into the chain of custody, as it would in a real investigation.' + (c.volatility ? ' One of these systems is still running.' : '') + '</p>' +
            hintBox(c, 'acquire') +
            '<div id="df-acquire" class="df-acquire"></div>' +
            '<div id="df-custody" class="df-custody"></div>';

        // 2 examine
        html += '<h2 class="df-step"><span>2</span> Examine and build your case file</h2>' +
            hintBox(c, 'examine') +
            '<div class="df-exam-layout">' +
                '<div class="df-examiner">' +
                    '<div class="df-search"><input id="df-search" type="text" aria-label="Keyword search across acquired evidence" placeholder="Keyword search across acquired evidence">' +
                    '<button class="btn btn-primary" id="df-search-btn" aria-label="Search"><i class="fas fa-magnifying-glass"></i></button></div>' +
                    '<div id="df-search-out"></div>' +
                    '<div id="df-ev-tabs" class="df-ev-tabs"></div>' +
                    '<div id="df-ev-body"></div>' +
                '</div>' +
                '<aside class="df-boardwrap"><div class="df-board-h"><i class="fas fa-thumbtack"></i> Evidence board <span id="df-board-count">0</span></div><div id="df-board"></div></aside>' +
            '</div>';

        // case stages
        (c.stages || []).forEach(function (stg) {
            n++;
            html += '<h2 class="df-step"><span>' + n + '</span> ' + esc(stg.title) + '</h2>' +
                '<p class="df-steptext">' + esc(stg.intro) + '</p>' +
                hintBox(c, stg.type) +
                '<div class="df-stage" id="df-stage-' + stg.id + '"></div>';
        });

        // conclusions
        n++;
        html += '<h2 class="df-step"><span>' + n + '</span> State your conclusions</h2>' +
            '<p class="df-steptext">Answer from the evidence you gathered. You are scored on the strength of your case file and the stages above, not just the final answers.</p>' +
            hintBox(c, 'conclude') +
            '<div id="df-questions" class="df-questions"></div>' +
            '<div class="df-submit-row"><button class="btn btn-primary" id="df-submit"><i class="fas fa-gavel"></i> Submit findings</button><span id="df-submit-msg" class="df-submit-msg" role="status"></span></div>' +
            '<div id="df-debrief"></div>';

        $('#df-case').innerHTML = html;
        renderAcquire(); renderExaminer(); renderBoard(); renderStages(); renderQuestions(); renderDebriefInline();
        wireHints(c);
        $('#df-search-btn').addEventListener('click', doSearch);
        $('#df-search').addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });
        $('#df-submit').addEventListener('click', submit);
        $('#df-restart').addEventListener('click', function () {
            if (!confirm('Restart "' + c.title + '"? Your work on this case will be cleared (your best score is kept).')) return;
            states[c.id] = freshState(c); renderCase(false); renderPicker();
        });
        if (scroll) { var top = $('#df-case').getBoundingClientRect().top + window.pageYOffset - 90; window.scrollTo({ top: top, behavior: 'smooth' }); }
    }

    /* ---------- 1. acquisition and chain of custody ---------- */
    function methodFor(e, proper) {
        if (e.live) return 'Live memory capture (WinPmem), saved to a sterile drive';
        if (e.type === 'Mobile device') return 'Full file-system extraction, phone in a Faraday bag';
        if (e.type === 'Disk image') return proper === false ? 'Booted the laptop and copied files off it' : 'Physical image through a hardware write-blocker (E01)';
        if (/log|Cloud|Server/i.test(e.type)) return 'Export from the log platform with an integrity hash';
        return 'Forensic copy with an integrity hash';
    }
    function acquire(c, e, proper) {
        var s = S(c);
        var seed = c.caseNo + '|' + e.id + '|' + e.name;
        sha256(seed).then(function (h) {
            var bad = proper === false;
            var finish = function (verifyHash) {
                s.acquired[e.id] = true;
                if (s.acqOrder.indexOf(e.id) === -1) s.acqOrder.push(e.id);
                if (bad) s.acqBad[e.id] = true; else if (s.acqBad[e.id]) s.acqFixed[e.id] = true;
                s.custody.push({ ev: e.name, method: methodFor(e, proper), hash: h, verify: verifyHash, ok: !bad, time: nowStamp() });
                flash(bad ? 'Copied, but the verification hash does not match the source. The evidence changed during acquisition.'
                    : 'Acquired and verified. Chain of custody recorded for ' + e.name + '.');
                renderAcquire(); renderExaminer(); renderPicker();
            };
            if (bad) sha256(seed + '|booted-and-modified').then(finish); else finish(h);
        });
    }
    function renderAcquire() {
        var c = cur, s = S(c), wrap = $('#df-acquire');
        wrap.innerHTML = c.evidence.map(function (e) {
            var got = s.acquired[e.id], bad = s.acqBad[e.id] && !s.acqFixed[e.id];
            var right;
            if (got && !bad) right = '<span class="df-ev-ok"><i class="fas fa-lock"></i> Acquired</span>';
            else if (bad) right = '<div class="df-ev-actions"><span class="df-ev-bad"><i class="fas fa-triangle-exclamation"></i> Hash mismatch</span><button class="btn btn-primary df-acq" data-e="' + e.id + '" data-proper="1">Re-image with a write-blocker</button></div>';
            else if (e.acquire && e.acquire.mode === 'writeblock' && s.acqChoice === e.id) right = '<div class="df-ev-choice"><span>How will you acquire it?</span>' +
                '<button class="btn btn-primary df-acq" data-e="' + e.id + '" data-proper="1"><i class="fas fa-shield-halved"></i> Image through a hardware write-blocker</button>' +
                '<button class="btn df-btn-ghost df-acq" data-e="' + e.id + '" data-proper="0"><i class="fas fa-power-off"></i> Boot it and copy the files off</button></div>';
            else right = '<button class="btn btn-primary df-acq" data-e="' + e.id + '"' + (e.acquire && e.acquire.mode === 'writeblock' ? ' data-choose="1"' : '') + '>' + (e.live ? 'Capture memory' : 'Acquire &amp; hash') + '</button>';
            return '<div class="df-ev ' + (got ? (bad ? 'is-bad' : 'is-acquired') : '') + '">' +
                '<div class="df-ev-ico"><i class="fas ' + e.icon + '"></i></div>' +
                '<div class="df-ev-b"><div class="df-ev-name">' + esc(e.name) + (e.live ? ' <span class="df-live">running</span>' : '') + '</div>' +
                '<div class="df-ev-meta">' + esc(e.type) + ' &middot; ' + esc(e.device) + ' &middot; ' + esc(e.size) + '</div></div>' +
                right + '</div>';
        }).join('');
        $$('#df-acquire .df-acq').forEach(function (b) {
            b.addEventListener('click', function () {
                var e = findEv(c, b.dataset.e);
                if (b.dataset.choose) { s.acqChoice = e.id; renderAcquire(); return; }
                b.disabled = true;
                acquire(c, e, b.dataset.proper === '0' ? false : (b.dataset.proper === '1' ? true : undefined));
            });
        });
        var cus = $('#df-custody');
        if (!s.custody.length) { cus.innerHTML = ''; return; }
        cus.innerHTML = '<div class="df-custody-h"><i class="fas fa-link"></i> Chain of custody</div>' +
            '<div class="df-custody-table" role="table">' +
            '<div class="df-cr df-cr-h" role="row"><span>#</span><span>Evidence</span><span>Method</span><span>SHA-256 at acquisition</span><span>Verification</span><span>Time</span></div>' +
            s.custody.map(function (r, i) {
                return '<div class="df-cr" role="row"><span>' + (i + 1) + '</span><span>' + esc(r.ev) + '</span><span>' + esc(r.method) + '</span>' +
                    '<span class="mono" title="' + r.hash + '">' + r.hash.slice(0, 16) + '…' + r.hash.slice(-8) + '</span>' +
                    '<span class="' + (r.ok ? 'ok' : 'bad') + '">' + (r.ok ? '<i class="fas fa-check"></i> Match' : '<i class="fas fa-xmark"></i> Mismatch (' + r.verify.slice(0, 8) + '…)') + '</span>' +
                    '<span class="mono">' + r.time + '</span></div>';
            }).join('') + '</div>';
    }

    /* ---------- 2. examiner, search and board ---------- */
    function renderExaminer() {
        var c = cur, s = S(c), tabs = $('#df-ev-tabs'), body = $('#df-ev-body');
        var avail = c.evidence.filter(function (e) { return s.acquired[e.id]; });
        if (!avail.length) { tabs.innerHTML = ''; body.innerHTML = '<div class="df-empty">Acquire an evidence source above to begin examining it.</div>'; return; }
        if (!s.openEv || !s.acquired[s.openEv]) s.openEv = avail[0].id;
        tabs.innerHTML = avail.map(function (e) {
            return '<button class="df-evtab ' + (e.id === s.openEv ? 'active' : '') + '" data-e="' + e.id + '"><i class="fas ' + e.icon + '"></i> ' + esc(e.name) + '</button>';
        }).join('');
        $$('#df-ev-tabs .df-evtab').forEach(function (b) { b.addEventListener('click', function () { s.openEv = b.dataset.e; renderExaminer(); }); });

        var e = findEv(c, s.openEv);
        var html = '<div class="df-examhead"><span class="df-examtool"><i class="fas fa-toolbox"></i> ' + esc(e.tool) + '</span></div>';
        if (s.acqBad[e.id] && !s.acqFixed[e.id]) html += '<div class="df-warnbar"><i class="fas fa-triangle-exclamation"></i> This copy failed hash verification. Anything you find in it can be challenged. Re-image the source with a write-blocker.</div>';
        html += e.groups.map(function (g) {
            return '<div class="df-group">' +
                '<div class="df-group-h">' + (g.icon ? '<i class="fas ' + g.icon + '"></i> ' : '') + esc(g.label) + '</div>' +
                g.items.map(function (it) {
                    var isTag = !!s.tagged[it.id];
                    return '<div class="df-art">' +
                        '<div class="df-art-b"><div class="df-art-t">' + esc(it.title) + '</div>' +
                        '<div class="df-art-time">' + esc(it.time) + '</div>' +
                        '<div class="df-art-d">' + esc(it.detail) + '</div>' +
                        (it.raw ? '<pre class="df-raw">' + esc(it.raw) + '</pre>' : '') + '</div>' +
                        '<button class="df-tag ' + (isTag ? 'is-tagged' : '') + '" data-a="' + it.id + '" aria-pressed="' + isTag + '">' + (isTag ? '<i class="fas fa-check"></i> Tagged' : '<i class="fas fa-flag"></i> Tag as evidence') + '</button>' +
                        '</div>';
                }).join('') +
                '</div>';
        }).join('');
        body.innerHTML = html;
        $$('#df-ev-body .df-tag').forEach(function (b) { b.addEventListener('click', function () { toggleTag(b.dataset.a); }); });
    }
    function toggleTag(id) {
        var c = cur, s = S(c);
        if (s.tagged[id]) delete s.tagged[id];
        else { var f = findArtifact(c, id); s.tagged[id] = { id: id, title: f.art.title, ev: f.ev.name }; }
        renderExaminer(); renderBoard();
        if ($('#df-search').value.trim()) doSearch();
    }
    function renderBoard() {
        var s = S(cur), box = $('#df-board'), ids = Object.keys(s.tagged);
        $('#df-board-count').textContent = ids.length;
        if (!ids.length) { box.innerHTML = '<div class="df-empty">Tag artifacts while you examine the evidence and they will collect here as your case file.</div>'; return; }
        box.innerHTML = ids.map(function (id) {
            var t = s.tagged[id];
            return '<div class="df-boarditem"><div class="df-bi-t">' + esc(t.title) + '</div><div class="df-bi-s">' + esc(t.ev) + '</div><button class="df-untag" data-a="' + id + '" aria-label="Remove from board">&times;</button></div>';
        }).join('');
        $$('#df-board .df-untag').forEach(function (b) { b.addEventListener('click', function () { toggleTag(b.dataset.a); }); });
    }
    function doSearch() {
        var c = cur, s = S(c), q = ($('#df-search').value || '').trim().toLowerCase(), out = $('#df-search-out');
        if (!q) { out.innerHTML = ''; return; }
        var hits = allArtifacts(c).filter(function (h) { return s.acquired[h.ev.id] && (h.art.title + ' ' + h.art.detail + ' ' + (h.art.raw || '') + ' ' + h.art.time).toLowerCase().indexOf(q) !== -1; });
        if (!hits.length) { out.innerHTML = '<div class="df-empty">No matches in acquired evidence' + (Object.keys(s.acquired).length < c.evidence.length ? '. Acquire more sources to widen the search.' : '.') + '</div>'; return; }
        out.innerHTML = '<div class="df-searchhits">' + hits.map(function (h) {
            return '<div class="df-hit"><span class="df-hit-ev">' + esc(h.ev.name) + '</span> <span class="df-hit-t">' + esc(h.art.title) + '</span><button class="df-tag mini ' + (s.tagged[h.art.id] ? 'is-tagged' : '') + '" data-a="' + h.art.id + '">' + (s.tagged[h.art.id] ? 'Tagged' : 'Tag') + '</button></div>';
        }).join('') + '</div>';
        $$('#df-search-out .df-tag').forEach(function (b) { b.addEventListener('click', function () { toggleTag(b.dataset.a); }); });
    }

    /* ---------- 3. stages ---------- */
    function renderStages() { (cur.stages || []).forEach(function (stg) { renderStage(stg); }); }
    function renderStage(stg) {
        var box = $('#df-stage-' + stg.id); if (!box) return;
        if (stg.type === 'timeline') renderTimeline(stg, box);
        else if (stg.type === 'integrity') renderIntegrity(stg, box);
        else if (stg.type === 'trace') renderTrace(stg, box);
    }

    function renderTimeline(stg, box) {
        var s = S(cur), order = s.order[stg.id], byId = {};
        stg.events.forEach(function (e) { byId[e.id] = e; });
        box.innerHTML = '<ol class="df-timeline">' + order.map(function (id, i) {
            return '<li class="df-tl-item"><span class="df-tl-n">' + (i + 1) + '</span><span class="df-tl-t">' + esc(byId[id].text) + '</span>' +
                '<span class="df-tl-btns"><button class="df-tl-btn" data-i="' + i + '" data-d="-1" aria-label="Move earlier"' + (i === 0 ? ' disabled' : '') + '><i class="fas fa-arrow-up"></i></button>' +
                '<button class="df-tl-btn" data-i="' + i + '" data-d="1" aria-label="Move later"' + (i === order.length - 1 ? ' disabled' : '') + '><i class="fas fa-arrow-down"></i></button></span></li>';
        }).join('') + '</ol><div class="df-stage-note"><i class="fas fa-clock"></i> Earliest at the top. Use the arrows to reorder.</div>';
        $$('.df-tl-btn', box).forEach(function (b) {
            b.addEventListener('click', function () {
                var i = +b.dataset.i, j = i + (+b.dataset.d);
                if (j < 0 || j >= order.length) return;
                var t = order[i]; order[i] = order[j]; order[j] = t;
                renderTimeline(stg, box);
                var again = $$('.df-tl-btn', box).filter(function (x) { return +x.dataset.i === j && x.dataset.d === b.dataset.d; })[0];
                if (again && !again.disabled) again.focus();
            });
        });
    }

    function renderIntegrity(stg, box) {
        var s = S(cur);
        box.innerHTML = '<div class="df-integrity">' + stg.items.map(function (it) {
            var v = s.integrity[it.id];
            return '<div class="df-int-row"><span class="df-int-t">' + esc(it.title) + '</span>' +
                '<span class="df-int-btns" role="group" aria-label="' + esc(it.title) + '">' +
                '<button class="df-int-btn' + (v === 'reliable' ? ' on ok' : '') + '" data-i="' + it.id + '" data-v="reliable" aria-pressed="' + (v === 'reliable') + '"><i class="fas fa-circle-check"></i> Reliable</button>' +
                '<button class="df-int-btn' + (v === 'altered' ? ' on bad' : '') + '" data-i="' + it.id + '" data-v="altered" aria-pressed="' + (v === 'altered') + '"><i class="fas fa-pen-ruler"></i> Altered</button>' +
                '</span></div>';
        }).join('') + '</div>';
        $$('.df-int-btn', box).forEach(function (b) {
            b.addEventListener('click', function () { s.integrity[b.dataset.i] = b.dataset.v; renderIntegrity(stg, box); });
        });
    }

    /* the block explorer */
    function renderTrace(stg, box) {
        var s = S(cur), here = s.trail[s.trail.length - 1], info = stg.addr[here];
        var txs = stg.txs.filter(function (t) { return t.ins.concat(t.outs).some(function (x) { return x.a === here; }); })
            .sort(function (a, b) { return a.time < b.time ? -1 : 1; });
        var recv = 0, sent = 0;
        stg.txs.forEach(function (t) {
            t.outs.forEach(function (o) { if (o.a === here) recv += o.v; });
            t.ins.forEach(function (x) { if (x.a === here) sent += x.v; });
        });
        var labelOf = function (k) { var d = stg.addr[k]; return d && d.label && d.entity !== 'attacker' && d.entity !== 'unknown' ? d.label : (k === stg.start ? stg.addr[k].label : ''); };
        var chip = function (x) {
            if (x.other) return '<span class="df-io df-io-other">' + esc(x.other) + '<b>' + btc(x.v) + '</b></span>';
            var lab = labelOf(x.a), flagged = !!s.flags[x.a];
            return '<button class="df-io' + (x.a === here ? ' here' : '') + (flagged ? ' flagged' : '') + '" data-go="' + x.a + '" title="' + stg.addr[x.a].a + '">' +
                '<span class="mono">' + shortAddr(stg.addr[x.a].a) + '</span>' + (lab ? '<small>' + esc(lab) + '</small>' : '') + '<b>' + btc(x.v) + '</b></button>';
        };
        var lab = labelOf(here);
        var html = '<div class="df-trace">' +
            '<div class="df-trace-search"><input id="df-trace-q" type="text" aria-label="Search an address" placeholder="Paste an address to look it up"><button class="btn btn-primary" id="df-trace-go">Look up</button></div>' +
            '<div class="df-trace-crumbs"><span>Path:</span>' + s.trail.map(function (k, i) {
                return '<button class="df-crumb' + (i === s.trail.length - 1 ? ' on' : '') + '" data-back="' + i + '">' + shortAddr(stg.addr[k].a) + '</button>';
            }).join('<i class="fas fa-chevron-right"></i>') + '</div>' +
            '<div class="df-addrcard">' +
                '<div class="df-addr-main"><div class="df-addr-a mono">' + esc(info.a) + '</div>' +
                '<div class="df-addr-l">' + (lab ? '<i class="fas fa-tag"></i> ' + esc(lab) : '<i class="fas fa-question"></i> Unattributed address') + '</div>' +
                '<div class="df-addr-stats"><span>Received <b>' + btc(recv) + '</b></span><span>Sent <b>' + btc(sent) + '</b></span><span>Balance <b>' + btc(Math.max(0, recv - sent)) + '</b></span><span><b>' + txs.length + '</b> transactions</span></div></div>' +
                '<button class="df-flag' + (s.flags[here] ? ' on' : '') + '" id="df-flag-here" aria-pressed="' + !!s.flags[here] + '">' + (s.flags[here] ? '<i class="fas fa-flag"></i> Flagged as attacker-controlled' : '<i class="far fa-flag"></i> Flag as attacker-controlled') + '</button>' +
            '</div>' +
            '<div class="df-txlist">' + txs.map(function (t) {
                var fee = t.ins.reduce(function (a, x) { return a + x.v; }, 0) - t.outs.reduce(function (a, x) { return a + x.v; }, 0);
                return '<div class="df-tx"><div class="df-tx-h"><span><i class="fas fa-cube"></i> tx <span class="mono">' + t.id + '…</span></span><span class="mono">' + esc(t.time) + '</span><span>fee ' + fee.toFixed(4) + '</span></div>' +
                    '<div class="df-tx-io"><div class="df-tx-col"><div class="df-tx-lab">Inputs</div>' + t.ins.map(chip).join('') + '</div>' +
                    '<div class="df-tx-arrow" aria-hidden="true"><i class="fas fa-arrow-right"></i></div>' +
                    '<div class="df-tx-col"><div class="df-tx-lab">Outputs</div>' + t.outs.map(chip).join('') + '</div></div></div>';
            }).join('') + (txs.length ? '' : '<div class="df-empty">No transactions.</div>') + '</div>' +
            '<div class="df-flagged"><div class="df-flagged-h"><i class="fas fa-flag"></i> Flagged as attacker-controlled (' + Object.keys(s.flags).length + ')</div>' +
                (Object.keys(s.flags).length ? Object.keys(s.flags).map(function (k) { return '<button class="df-flagchip" data-go="' + k + '"><span class="mono">' + shortAddr(stg.addr[k].a) + '</span></button>'; }).join('') : '<div class="df-empty small">Nothing flagged yet.</div>') +
            '</div></div>';
        box.innerHTML = html;
        var go = function (k) { if (!stg.addr[k]) return; if (s.trail[s.trail.length - 1] !== k) s.trail.push(k); if (s.trail.length > 14) s.trail.splice(1, 1); renderTrace(stg, box); };
        $$('[data-go]', box).forEach(function (b) { b.addEventListener('click', function () { go(b.dataset.go); }); });
        $$('[data-back]', box).forEach(function (b) { b.addEventListener('click', function () { s.trail = s.trail.slice(0, +b.dataset.back + 1); renderTrace(stg, box); }); });
        $('#df-flag-here', box).addEventListener('click', function () { if (s.flags[here]) delete s.flags[here]; else s.flags[here] = true; renderTrace(stg, box); });
        var lookup = function () {
            var q = ($('#df-trace-q', box).value || '').trim().toLowerCase(); if (!q) return;
            var hit = Object.keys(stg.addr).filter(function (k) { var a = stg.addr[k].a.toLowerCase(); return a === q || (q.length >= 6 && (a.indexOf(q) !== -1)); })[0];
            if (hit) go(hit); else flash('That address does not appear in any transaction in this trace.');
        };
        $('#df-trace-go', box).addEventListener('click', lookup);
        $('#df-trace-q', box).addEventListener('keydown', function (e) { if (e.key === 'Enter') lookup(); });
    }

    /* ---------- 4. questions ---------- */
    function renderQuestions() {
        var c = cur, s = S(c), box = $('#df-questions');
        box.innerHTML = c.questions.map(function (q, qi) {
            var multi = q.type === 'multi', a = s.answers[q.id];
            return '<fieldset class="df-q"><legend><span class="df-q-n">' + (qi + 1) + '</span> ' + esc(q.q) + (multi ? ' <small>(select all that apply)</small>' : '') + '</legend>' +
                q.options.map(function (o) {
                    var checked = multi ? (a || []).indexOf(o.id) !== -1 : a === o.id;
                    return '<label class="df-opt' + (checked ? ' on' : '') + '"><input type="' + (multi ? 'checkbox' : 'radio') + '" name="df-' + q.id + '" value="' + o.id + '"' + (checked ? ' checked' : '') + '> <span>' + esc(o.text) + '</span></label>';
                }).join('') + '</fieldset>';
        }).join('');
        $$('input', box).forEach(function (inp) {
            inp.addEventListener('change', function () {
                var qid = inp.name.slice(3), q = c.questions.filter(function (x) { return x.id === qid; })[0];
                if (q.type === 'multi') s.answers[qid] = $$('input[name="df-' + qid + '"]:checked', box).map(function (x) { return x.value; });
                else s.answers[qid] = inp.value;
                $$('input[name="df-' + qid + '"]', box).forEach(function (x) { x.parentNode.classList.toggle('on', x.checked); });
            });
        });
    }

    /* ---------- scoring ---------- */
    function grade(c) {
        var s = S(c), parts = [], earned = 0, max = 0;
        var add = function (label, got, mx, note) { got = Math.max(0, Math.min(mx, got)); parts.push({ label: label, got: got, max: mx, note: note }); earned += got; max += mx; };

        var inc = allArtifacts(c).filter(function (h) { return h.art.incriminating; }).map(function (h) { return h.art.id; });
        var tagIds = Object.keys(s.tagged);
        var tInc = tagIds.filter(function (id) { return inc.indexOf(id) !== -1; });
        var wrong = tagIds.filter(function (id) { return inc.indexOf(id) === -1; });
        var coverage = inc.length ? tInc.length / inc.length : 1;
        var E = c.evidenceWeight || 30;
        add('Evidence file', E * coverage - 3 * wrong.length, E, tInc.length + ' of ' + inc.length + ' key artifacts tagged, ' + wrong.length + ' false lead' + (wrong.length === 1 ? '' : 's'));

        // chain of custody
        var acquiredAll = c.evidence.every(function (e) { return s.acquired[e.id]; });
        var badOpen = Object.keys(s.acqBad).filter(function (id) { return !s.acqFixed[id]; });
        var fixed = Object.keys(s.acqFixed);
        var cust = 10 - (acquiredAll ? 0 : 4) - badOpen.length * 10 - fixed.length * 5;
        add('Chain of custody', cust, 10, badOpen.length ? 'A source failed hash verification and was never re-imaged' : fixed.length ? 'A first copy failed verification; you re-imaged it properly' : acquiredAll ? 'Every source acquired and verified' : 'Not every source was acquired');

        if (c.volatility) {
            var first = s.acqOrder[0], okv = first === c.volatility.first;
            add('Order of volatility', okv ? c.volatility.points : 0, c.volatility.points, okv ? 'Memory captured first, before anything else' : 'The running system\'s memory was not captured first');
        }

        var stageFeedback = [];
        (c.stages || []).forEach(function (stg) {
            if (stg.type === 'timeline') {
                var o = s.order[stg.id], pos = {}, pairs = 0, good = 0;
                stg.order.forEach(function (id, i) { pos[id] = i; });
                for (var i = 0; i < o.length; i++) for (var j = i + 1; j < o.length; j++) { pairs++; if (pos[o[i]] < pos[o[j]]) good++; }
                var exact = o.filter(function (id, i) { return stg.order[i] === id; }).length;
                add('Timeline', stg.points * (pairs ? good / pairs : 1), stg.points, exact + ' of ' + o.length + ' events in exactly the right place');
                stageFeedback.push({ type: 'timeline', stg: stg, exact: exact === o.length });
            } else if (stg.type === 'integrity') {
                var right = stg.items.filter(function (it) { return s.integrity[it.id] === it.answer; }).length;
                add('Evidence integrity', stg.points * right / stg.items.length, stg.points, right + ' of ' + stg.items.length + ' records judged correctly');
                stageFeedback.push({ type: 'integrity', stg: stg });
            } else if (stg.type === 'trace') {
                var flags = Object.keys(s.flags), hit = flags.filter(function (k) { return stg.attacker.indexOf(k) !== -1; }), miss = flags.filter(function (k) { return stg.attacker.indexOf(k) === -1; });
                add('Blockchain trace', stg.points * (hit.length - miss.length) / stg.attacker.length, stg.points, hit.length + ' of ' + stg.attacker.length + ' attacker addresses flagged, ' + miss.length + ' wrongly flagged');
                stageFeedback.push({ type: 'trace', stg: stg, hit: hit, miss: miss });
            }
        });

        var qres = c.questions.map(function (q) {
            var a = s.answers[q.id], ok, got;
            if (q.type === 'multi') {
                a = a || [];
                var right = a.filter(function (x) { return q.answer.indexOf(x) !== -1; }).length, bad = a.length - right;
                got = q.points * Math.max(0, (right - bad) / q.answer.length);
                ok = right === q.answer.length && bad === 0;
            } else { ok = a === q.answer; got = ok ? q.points : 0; }
            earned += got; max += q.points;
            return { q: q, ok: ok, got: got };
        });
        parts.push({ label: 'Conclusions', got: qres.reduce(function (t, r) { return t + r.got; }, 0), max: c.questions.reduce(function (t, q) { return t + q.points; }, 0), note: qres.filter(function (r) { return r.ok; }).length + ' of ' + qres.length + ' answered correctly' });

        var hintsUsed = (c.hintCost || 0) ? Object.keys(s.hints).length : 0;
        var penalty = hintsUsed * (c.hintCost || 0);
        var score = Math.max(0, Math.min(100, Math.round(earned / max * 100) - penalty));
        var keyOk = qres.every(function (r) { return !r.q.key || r.ok; });
        var minCov = (c.minCoverage || 50) / 100;
        var solved = keyOk && coverage >= minCov && score >= 60 && !badOpen.length;
        return { score: score, parts: parts, qres: qres, coverage: coverage, keyOk: keyOk, solved: solved, hintsUsed: hintsUsed, penalty: penalty, badOpen: badOpen.length, stageFeedback: stageFeedback, minCov: minCov };
    }

    function submit() {
        var c = cur, s = S(c), msg = $('#df-submit-msg');
        var missing = c.questions.filter(function (q) { var a = s.answers[q.id]; return q.type === 'multi' ? !(a && a.length) : !a; });
        if (missing.length) { msg.textContent = 'Answer every question first (' + missing.length + ' left).'; msg.className = 'df-submit-msg warn'; return; }
        if (!Object.keys(s.acquired).length) { msg.textContent = 'Acquire and examine the evidence before you submit.'; msg.className = 'df-submit-msg warn'; return; }
        msg.textContent = ''; msg.className = 'df-submit-msg';
        var r = grade(c);
        s.submitted = r;
        var p = progress[c.id] || {};
        p.best = Math.max(p.best || 0, r.score);
        p.solved = !!(p.solved || r.solved);
        p.at = Date.now();
        progress[c.id] = p; saveProgress(progress);
        renderPicker(); updateCertificate(); renderDebriefInline();
        showVerdict(c, r);
    }

    /* ---------- verdict and debrief ---------- */
    function feedbackHtml(c, r, reveal) {
        var html = '<div class="df-fb">';
        r.qres.forEach(function (x, i) {
            var answerText = '';
            if (reveal || x.ok) {
                var ans = x.q.type === 'multi' ? x.q.options.filter(function (o) { return x.q.answer.indexOf(o.id) !== -1; }).map(function (o) { return o.text; }).join('; ') : (x.q.options.filter(function (o) { return o.id === x.q.answer; })[0] || {}).text;
                answerText = '<div class="df-fb-a"><b>Answer:</b> ' + esc(ans) + '</div><div class="df-fb-e">' + esc(x.q.explain || '') + '</div>';
            } else {
                answerText = '<div class="df-fb-e">Not quite. Go back to the evidence and try again, or reveal the solution.</div>';
            }
            html += '<div class="df-fb-row ' + (x.ok ? 'ok' : 'bad') + '"><i class="fas ' + (x.ok ? 'fa-circle-check' : 'fa-circle-xmark') + '"></i><div><div class="df-fb-q">' + (i + 1) + '. ' + esc(x.q.q) + '</div>' + answerText + '</div></div>';
        });
        r.stageFeedback.forEach(function (f) {
            if (f.type === 'timeline' && (reveal || f.exact)) {
                var byId = {}; f.stg.events.forEach(function (e) { byId[e.id] = e.text; });
                html += '<div class="df-fb-row ' + (f.exact ? 'ok' : 'bad') + '"><i class="fas fa-clock"></i><div><div class="df-fb-q">Correct timeline</div><ol class="df-fb-list">' + f.stg.order.map(function (id) { return '<li>' + esc(byId[id]) + '</li>'; }).join('') + '</ol></div></div>';
            }
            if (f.type === 'integrity' && reveal) {
                html += '<div class="df-fb-row ok"><i class="fas fa-scale-balanced"></i><div><div class="df-fb-q">Which records you can rely on</div><ul class="df-fb-list">' + f.stg.items.map(function (it) { return '<li><b>' + (it.answer === 'reliable' ? 'Reliable' : 'Altered') + ':</b> ' + esc(it.title) + '. ' + esc(it.why) + '</li>'; }).join('') + '</ul></div></div>';
            }
            if (f.type === 'trace' && reveal) {
                html += '<div class="df-fb-row ok"><i class="fas fa-link"></i><div><div class="df-fb-q">Attacker-controlled addresses</div><ul class="df-fb-list">' + f.stg.attacker.map(function (k) { return '<li class="mono">' + esc(f.stg.addr[k].a) + '</li>'; }).join('') + '</ul></div></div>';
            }
        });
        return html + '</div>';
    }
    function debriefHtml(c, r, reveal) {
        var d = c.debrief, show = reveal || r.solved;
        var html = '';
        if (show) html += '<div class="df-story"><div class="df-story-h"><i class="fas fa-book-open"></i> What happened</div><p>' + esc(d.story) + '</p></div>';
        html += '<div class="df-breakdown">' + r.parts.map(function (p) {
            return '<div class="df-bd-row"><span class="df-bd-l">' + esc(p.label) + '</span><span class="df-bd-bar"><i style="width:' + Math.round(p.got / p.max * 100) + '%"></i></span><span class="df-bd-v">' + Math.round(p.got) + '/' + p.max + '</span><span class="df-bd-n">' + esc(p.note) + '</span></div>';
        }).join('') + (r.penalty ? '<div class="df-bd-row"><span class="df-bd-l">Hints</span><span class="df-bd-bar"></span><span class="df-bd-v">&minus;' + r.penalty + '</span><span class="df-bd-n">' + r.hintsUsed + ' hint' + (r.hintsUsed === 1 ? '' : 's') + ' used</span></div>' : '') + '</div>';
        html += feedbackHtml(c, r, reveal);
        if (show) {
            html += '<div class="df-lessons"><div class="df-story-h"><i class="fas fa-graduation-cap"></i> Lessons for practitioners</div><ul>' + d.lessons.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul>' +
                '<div class="df-refs"><b>References:</b> ' + d.refs.map(esc).join(' &middot; ') + '</div>' +
                (d.readMore ? '<a class="df-readmore" href="' + d.readMore.href + '" target="_blank" rel="noopener"><i class="fas fa-file-pdf"></i> ' + esc(d.readMore.text) + '</a>' : '') + '</div>';
        }
        return html;
    }
    function verdictLine(c, r) {
        if (r.solved) return 'Case solved. Your findings are corroborated across the evidence and would stand up to review.';
        if (r.badOpen) return 'Your conclusions may be right, but a source failed hash verification and was never re-imaged. A defence expert would have the evidence thrown out.';
        if (r.keyOk && r.coverage < r.minCov) return 'Right conclusions, thin file. You only tagged ' + Math.round(r.coverage * 100) + '% of the key artifacts. Corroborate across every source before you sign off.';
        if (r.keyOk) return 'The key conclusions are right, but the overall case is not strong enough yet. Look at the breakdown to see where you lost points.';
        return 'That does not hold up yet. At least one key conclusion is wrong. Review the evidence and try again.';
    }
    function showVerdict(c, r) {
        var modal = $('#df-verdict'), idx = caseIndex(c), next = CASES[idx + 1];
        var cls = r.solved ? 'ok' : r.keyOk ? 'warn' : 'bad';
        modal.innerHTML = '<div class="df-verdict-card" role="dialog" aria-modal="true" aria-labelledby="df-v-title">' +
            '<button class="df-verdict-x" aria-label="Close">&times;</button>' +
            '<div class="df-verdict-top"><div class="df-verdict-score ' + cls + '">' + r.score + '<span>/100</span></div>' +
            '<div><div class="df-verdict-case">Level ' + c.level + ' &middot; ' + esc(c.title) + '</div><h3 id="df-v-title">' + (r.solved ? 'Case closed' : 'Review needed') + '</h3></div></div>' +
            '<p class="df-verdict-p">' + esc(verdictLine(c, r)) + '</p>' +
            '<div id="df-v-body">' + debriefHtml(c, r, S(c).revealed) + '</div>' +
            '<div class="df-verdict-actions">' +
                (r.solved && next ? '<button class="btn btn-primary" id="df-v-next">Next case: Level ' + next.level + ' <i class="fas fa-arrow-right"></i></button>' : '') +
                (!r.solved && !S(c).revealed ? '<button class="btn df-btn-ghost" id="df-v-reveal"><i class="fas fa-eye"></i> Reveal the solution</button>' : '') +
                '<button class="btn df-btn-ghost" id="df-v-close">' + (r.solved ? 'Review the case' : 'Back to the evidence') + '</button>' +
            '</div></div>';
        modal.classList.add('show');
        var close = function () { modal.classList.remove('show'); document.removeEventListener('keydown', onKey); var b = $('#df-submit'); if (b) b.focus(); };
        var onKey = function (e) { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', onKey);
        $('.df-verdict-x', modal).addEventListener('click', close);
        $('#df-v-close', modal).addEventListener('click', close);
        modal.onclick = function (e) { if (e.target === modal) close(); };
        var nx = $('#df-v-next', modal); if (nx) nx.addEventListener('click', function () { close(); cur = next; renderPicker(); renderCase(true); });
        var rv = $('#df-v-reveal', modal); if (rv) rv.addEventListener('click', function () {
            S(c).revealed = true; $('#df-v-body', modal).innerHTML = debriefHtml(c, r, true); rv.remove(); renderDebriefInline();
        });
        var card = $('.df-verdict-card', modal); if (card) card.scrollTop = 0;
        setTimeout(function () { var f = $('#df-v-next', modal) || $('#df-v-close', modal); if (f) f.focus({ preventScroll: true }); }, 30);
    }
    function renderDebriefInline() {
        var c = cur, s = S(c), box = $('#df-debrief'); if (!box) return;
        if (!s.submitted) { box.innerHTML = ''; return; }
        box.innerHTML = '<div class="df-debrief"><div class="df-debrief-h"><span class="df-verdict-score small ' + (s.submitted.solved ? 'ok' : s.submitted.keyOk ? 'warn' : 'bad') + '">' + s.submitted.score + '<span>/100</span></span>' +
            '<div><b>' + (s.submitted.solved ? 'Case closed' : 'Review needed') + '</b><div>' + esc(verdictLine(c, s.submitted)) + '</div></div></div>' +
            debriefHtml(c, s.submitted, s.revealed) + '</div>';
    }

    /* ---------- certificate ---------- */
    function updateCertificate() {
        var wrap = $('#df-cert-wrap'); if (!wrap) return;
        var all = CASES.every(function (c) { return progress[c.id] && progress[c.id].solved; });
        wrap.hidden = !all;
    }

    function flash(t) {
        $$('.df-flash').forEach(function (old) { old.remove(); });
        var d = document.createElement('div'); d.className = 'df-flash'; d.setAttribute('role', 'status'); d.textContent = t; document.body.appendChild(d);
        setTimeout(function () { d.classList.add('show'); }, 10);
        setTimeout(function () { d.classList.remove('show'); setTimeout(function () { d.remove(); }, 300); }, 3400);
    }
})();
