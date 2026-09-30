/* ==========================================================================
   certificate.js (2026)
   Shared, dependency-free completion-certificate handler used by any lab that
   has a .certificate block. It:
     - asks the visitor for their name (remembered across labs via localStorage)
     - fills the certificate recipient live, so nothing is hardcoded
     - draws a professional certificate on a canvas and downloads it as PNG
     - makes the Download and Share buttons actually work
   ========================================================================== */
(function () {
    'use strict';
    function ready(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
        else fn();
    }

    ready(function () {
        var cert = document.querySelector('.certificate');
        if (!cert) return;

        var NAME_KEY = 'learnerName';
        function savedName() { try { return localStorage.getItem(NAME_KEY) || ''; } catch (e) { return ''; } }
        function saveName(n) { try { localStorage.setItem(NAME_KEY, n); } catch (e) {} }

        // find the recipient element: the <h4> right after the "awarded to" line,
        // or any element still holding the placeholder / hardcoded name.
        var recipient = null;
        var awarded = Array.prototype.find.call(cert.querySelectorAll('p'), function (p) {
            return /awarded to|presented to/i.test(p.textContent);
        });
        if (awarded) {
            var el = awarded.nextElementSibling;
            while (el && el.tagName !== 'H4') el = el.nextElementSibling;
            recipient = el;
        }
        if (!recipient) {
            recipient = Array.prototype.find.call(cert.querySelectorAll('h4'), function (h) {
                return /your name here|^\s*aziz\s*$/i.test(h.textContent);
            });
        }
        if (!recipient) return;
        recipient.id = 'cert-recipient';

        // lab name from the certificate subtitle or the breadcrumb
        var labName = '';
        var h3 = cert.querySelector('h3');
        if (h3) labName = h3.textContent.replace(/\s+/g, ' ').trim();
        if (!labName) {
            var crumb = document.querySelector('.lab-crumbs span:last-child');
            if (crumb) labName = crumb.textContent.trim();
        }

        var descP = recipient.nextElementSibling;
        var description = descP ? descP.textContent.replace(/\s+/g, ' ').trim() : ('For successfully completing the ' + labName + '.');

        function currentName() {
            var n = (document.getElementById('cert-name-input') || {}).value;
            n = (n || '').trim();
            return n || savedName() || 'Your Name';
        }
        function refresh() {
            recipient.textContent = currentName();
        }

        // build the name control and insert it above the certificate
        var box = document.createElement('div');
        box.className = 'cert-namebox';
        box.innerHTML =
            '<label for="cert-name-input" data-en="Enter your name for the certificate" data-ar="أدخل اسمك للحصول على الشهادة">Enter your name for the certificate</label>' +
            '<input id="cert-name-input" type="text" autocomplete="name" placeholder="Your full name" maxlength="60">';
        var container = cert.closest('.certificate-container') || cert.parentNode;
        container.parentNode.insertBefore(box, container);

        var input = box.querySelector('#cert-name-input');
        input.value = savedName();
        refresh();
        input.addEventListener('input', function () { saveName(input.value.trim()); refresh(); });

        // date + instructor from the certificate if present
        var instructor = 'Aziz Alghamdi';
        var today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

        // wrap text helper for canvas
        function wrap(ctx, text, x, y, maxW, lh) {
            var words = text.split(' '), line = '', yy = y;
            for (var i = 0; i < words.length; i++) {
                var test = line + words[i] + ' ';
                if (ctx.measureText(test).width > maxW && i > 0) {
                    ctx.fillText(line.trim(), x, yy); line = words[i] + ' '; yy += lh;
                } else { line = test; }
            }
            ctx.fillText(line.trim(), x, yy);
            return yy;
        }

        function draw() {
            var W = 1400, H = 990, c = document.createElement('canvas');
            c.width = W; c.height = H;
            var ctx = c.getContext('2d');
            // background
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#fbfaf7'; ctx.fillRect(24, 24, W - 48, H - 48);
            // borders
            ctx.strokeStyle = '#212529'; ctx.lineWidth = 6; ctx.strokeRect(40, 40, W - 80, H - 80);
            ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 2; ctx.strokeRect(56, 56, W - 112, H - 112);
            ctx.textAlign = 'center';
            // heading
            ctx.fillStyle = '#212529';
            ctx.font = '700 62px Georgia, "Times New Roman", serif';
            ctx.fillText('Certificate of Completion', W / 2, 190);
            // rule
            ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(W / 2 - 120, 220); ctx.lineTo(W / 2 + 120, 220); ctx.stroke();
            // lab name
            ctx.fillStyle = '#495057'; ctx.font = '400 34px Georgia, serif';
            wrap(ctx, labName || 'Interactive Security Lab', W / 2, 300, W - 300, 42);
            // awarded to
            ctx.fillStyle = '#6c757d'; ctx.font = '400 26px "Segoe UI", sans-serif';
            ctx.fillText('This certificate is proudly awarded to', W / 2, 400);
            // name
            ctx.fillStyle = '#212529'; ctx.font = '700 68px Georgia, serif';
            ctx.fillText(currentName(), W / 2, 490);
            ctx.strokeStyle = '#dee2e6'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(W / 2 - 320, 520); ctx.lineTo(W / 2 + 320, 520); ctx.stroke();
            // description
            ctx.fillStyle = '#495057'; ctx.font = '400 25px "Segoe UI", sans-serif';
            wrap(ctx, description, W / 2, 590, W - 380, 36);
            // seal
            ctx.beginPath(); ctx.arc(W / 2, 720, 52, 0, Math.PI * 2);
            ctx.fillStyle = '#212529'; ctx.fill();
            ctx.fillStyle = '#c9a24a'; ctx.font = '900 46px "Font Awesome 6 Free"';
            // fallback glyph if FA not available on canvas: draw a check
            ctx.fillStyle = '#f8f9fa'; ctx.font = '700 40px Georgia, serif'; ctx.fillText('\u2713', W / 2, 736);
            // signatures
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#adb5bd'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(300, 860); ctx.lineTo(560, 860); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(W - 560, 860); ctx.lineTo(W - 300, 860); ctx.stroke();
            ctx.fillStyle = '#212529'; ctx.font = '600 26px Georgia, serif';
            ctx.fillText(instructor, 430, 850);
            ctx.fillText(today, W - 430, 850);
            ctx.fillStyle = '#6c757d'; ctx.font = '400 20px "Segoe UI", sans-serif';
            ctx.fillText('Instructor', 430, 890);
            ctx.fillText('Date', W - 430, 890);
            return c;
        }

        function download() {
            var name = currentName();
            if (name === 'Your Name') { input.focus(); input.classList.add('cert-need'); return; }
            var c = draw();
            var a = document.createElement('a');
            a.href = c.toDataURL('image/png');
            a.download = (labName ? labName.replace(/[^a-z0-9]+/gi, '_') : 'certificate') + '_' + name.replace(/[^a-z0-9]+/gi, '_') + '.png';
            document.body.appendChild(a); a.click(); a.remove();
        }

        function share() {
            var name = currentName();
            var msg = name + ' completed the ' + (labName || 'security lab') + ' on Aziz Alghamdi\'s cybersecurity learning platform (aziz.life).';
            if (navigator.share) { navigator.share({ title: 'Certificate', text: msg, url: 'https://aziz.life' }).catch(function () {}); }
            else if (navigator.clipboard) { navigator.clipboard.writeText(msg + ' https://aziz.life'); flash('Copied a shareable summary to your clipboard.'); }
            else { flash('Share text: ' + msg); }
        }
        function flash(t) {
            var d = document.createElement('div'); d.className = 'cert-flash'; d.textContent = t;
            document.body.appendChild(d); setTimeout(function () { d.classList.add('show'); }, 10);
            setTimeout(function () { d.classList.remove('show'); setTimeout(function () { d.remove(); }, 300); }, 2600);
        }

        // wire the existing buttons (Download / Share) without depending on their old handlers
        var btns = container.querySelectorAll('a.btn, button.btn');
        btns.forEach(function (b) {
            var t = b.textContent.toLowerCase();
            if (t.indexOf('download') !== -1) {
                b.removeAttribute('onclick'); b.removeAttribute('href');
                b.style.cursor = 'pointer';
                b.addEventListener('click', function (e) { e.preventDefault(); download(); });
            } else if (t.indexOf('share') !== -1) {
                b.removeAttribute('onclick'); b.removeAttribute('href');
                b.style.cursor = 'pointer';
                b.addEventListener('click', function (e) { e.preventDefault(); share(); });
            }
        });
        // stop old broken downloadPDF from throwing if referenced elsewhere
        if (typeof window.downloadPDF !== 'function') window.downloadPDF = download;
    });
})();
