/* ==========================================================================
   lab-frame.js (2026)
   Injects the same header and footer used on the home page into every
   interactive lab, so all labs match. Removes each lab's old, inconsistent
   header/footer first. Adds a breadcrumb and prev/next lab navigation.
   Relies on translator.js (loaded alongside) for the EN/AR switch.
   ========================================================================== */
(function () {
    'use strict';

    // work out the path back to the site root from this script's own src
    var me = document.currentScript || (function () {
        var s = document.getElementsByTagName('script');
        for (var i = s.length - 1; i >= 0; i--) { if (/lab-frame\.js/.test(s[i].src)) return s[i]; }
        return null;
    })();
    var ROOT = '../../';
    if (me && me.src) { ROOT = me.src.replace(/lab-frame\.js.*$/, ''); }
    var LABS = ROOT + 'Interactive_Section/html/';

    // ordered lab list for prev/next + titles
    var ORDER = [
        ['soc-simulation', 'SOC Analyst Simulation'],
        ['edr-lab', 'Endpoint Defense Lab'],
        ['network-toolkit', 'Network Security Lab'],
        ['pentest-lab', 'Penetration Testing Lab'],
        ['owasp-workshop', 'OWASP Top 10 Workshop'],
        ['digital-forensics', 'Digital Forensics Challenge'],
        ['encryption-playground', 'Cryptography Lab'],
        ['social-engineering-quiz', 'Social Engineering Quiz'],
        ['ctf-game', 'Capture The Flag'],
        ['cloud-security', 'Cloud Security Sandbox'],
        ['compliance-navigator', 'Compliance Navigator'],
        ['architecture-designer', 'Secure Architecture Designer']
    ];

    function slug() {
        var m = location.pathname.split('/').pop().replace(/\.html$/, '');
        return m || 'soc-simulation';
    }
    function titleFor(s) {
        for (var i = 0; i < ORDER.length; i++) { if (ORDER[i][0] === s) return ORDER[i][1]; }
        return document.title.replace(/\s*[|\-].*$/, '').trim() || 'Lab';
    }

    var here = slug();
    var here_title = titleFor(here);

    // remove the old per-page header/footer so we do not get duplicates
    function stripOld() {
        var hs = document.querySelectorAll('body > header');
        hs.forEach(function (h) { h.parentNode.removeChild(h); });
        var fs = document.querySelectorAll('body > footer');
        fs.forEach(function (f) { f.parentNode.removeChild(f); });
        // stray language switchers the old pages may have inlined
        var ls = document.querySelectorAll('.language-switcher');
        ls.forEach(function (l) { l.parentNode.removeChild(l); });
    }

    var nav = [
        ['About', 'about', 'نبذة عني'],
        ['Experience', 'experience', 'الخبرة'],
        ['Research', 'research', 'الأبحاث'],
        ['Projects', 'projects', 'المشاريع'],
        ['Certifications', 'certifications', 'الشهادات'],
        ['Contact', 'contact', 'اتصل بي']
    ];
    function navHtml() {
        var items = nav.map(function (n) {
            return '<li><a href="' + ROOT + 'index.html#' + n[1] + '" data-en="' + n[0] + '" data-ar="' + n[2] + '">' + n[0] + '</a></li>';
        }).join('');
        items += '<li><a href="' + LABS + 'interactive-section.html" data-en="Labs" data-ar="المختبرات">Labs</a></li>';
        return items;
    }

    function headerHtml() {
        return '' +
        '<div class="language-switcher">' +
            '<i class="fas fa-language"></i>' +
            '<button id="en-btn" class="active" onclick="changeLanguage(\'en\')">EN</button>' +
            '<button id="ar-btn" onclick="changeLanguage(\'ar\')">AR</button>' +
        '</div>' +
        '<header>' +
            '<div class="container"><nav>' +
                '<div class="logo"><a href="' + ROOT + 'index.html"><i class="fas fa-shield-alt"></i> Aziz Alghamdi <span lang="ar">عزيز الغامدي</span></a></div>' +
                '<div class="mobile-menu-btn"><i class="fas fa-bars"></i></div>' +
                '<ul class="nav-links">' + navHtml() + '</ul>' +
            '</nav></div>' +
        '</header>' +
        '<div class="lab-crumbs"><div class="container">' +
            '<a href="' + ROOT + 'index.html" data-en="Home" data-ar="الرئيسية">Home</a><span class="sep">/</span>' +
            '<a href="' + LABS + 'interactive-section.html" data-en="Labs" data-ar="المختبرات">Labs</a><span class="sep">/</span>' +
            '<span>' + here_title + '</span>' +
        '</div></div>';
    }

    function footerHtml() {
        // prev/next
        var idx = -1; for (var i = 0; i < ORDER.length; i++) { if (ORDER[i][0] === here) { idx = i; break; } }
        var prev = idx > 0 ? ORDER[idx - 1] : null;
        var next = idx >= 0 && idx < ORDER.length - 1 ? ORDER[idx + 1] : null;
        var navRow = '<div class="lab-nav">' +
            (prev ? '<a href="' + LABS + prev[0] + '.html"><i class="fas fa-arrow-left"></i> ' + prev[1] + '</a>' : '<span class="spacer"></span>') +
            '<span class="spacer"></span>' +
            (next ? '<a href="' + LABS + next[0] + '.html">' + next[1] + ' <i class="fas fa-arrow-right"></i></a>' : '') +
            '</div>';

        return navRow +
        '<footer>' +
            '<div class="container"><div class="footer-content">' +
                '<div class="footer-about">' +
                    '<h3>Aziz Alghamdi</h3>' +
                    '<p data-en="IT and Information Security Senior Consultant at ECOVIS Al Sabti in Riyadh, focused on SAMA, NCA and ITGC assessments for financial, government and defense-sector clients." data-ar="مستشار أول لأمن المعلومات وتقنية المعلومات في إيكوفيس السبتي بالرياض، متخصص في تقييمات ساما والهيئة الوطنية للأمن السيبراني وضوابط تقنية المعلومات.">IT and Information Security Senior Consultant at ECOVIS Al Sabti in Riyadh, focused on SAMA, NCA and ITGC assessments for financial, government and defense-sector clients.</p>' +
                    '<div class="social-links">' +
                        '<a href="https://linkedin.com/in/abdulaziz-alghamdi-525810360" class="social-link"><i class="fab fa-linkedin-in"></i></a>' +
                        '<a href="https://github.com/iz2a" class="social-link"><i class="fab fa-github"></i></a>' +
                        '<a href="https://www.researchgate.net/profile/Aziz-Alghamdi-3" class="social-link"><i class="fab fa-researchgate"></i></a>' +
                    '</div>' +
                '</div>' +
                '<div class="footer-links">' +
                    '<h3 data-en="Quick Links" data-ar="روابط سريعة">Quick Links</h3>' +
                    '<ul class="quick-links">' +
                        '<li><a href="' + ROOT + 'index.html" data-en="Home" data-ar="الرئيسية">Home</a></li>' +
                        '<li><a href="' + LABS + 'interactive-section.html" data-en="All Labs" data-ar="كل المختبرات">All Labs</a></li>' +
                        '<li><a href="' + ROOT + 'index.html#research" data-en="Research" data-ar="الأبحاث">Research</a></li>' +
                        '<li><a href="' + ROOT + 'My_Resume.pdf" data-en="Download CV" data-ar="تحميل السيرة الذاتية">Download CV</a></li>' +
                        '<li><a href="' + ROOT + 'Privacy_Policy.pdf" data-en="Privacy Policy" data-ar="سياسة الخصوصية">Privacy Policy</a></li>' +
                    '</ul>' +
                '</div>' +
            '</div>' +
            '<div class="copyright"><p><span data-en="&copy; 2026 Aziz Alghamdi. All Rights Reserved." data-ar="&copy; 2026 عزيز الغامدي. جميع الحقوق محفوظة.">&copy; 2026 Aziz Alghamdi. All Rights Reserved.</span></p></div>' +
            '</div>' +
        '</footer>';
    }

    function wire() {
        var btn = document.querySelector('.mobile-menu-btn');
        var links = document.querySelector('.nav-links');
        if (btn && links) btn.addEventListener('click', function () { links.classList.toggle('active'); });
        // restore saved language
        try {
            var lang = localStorage.getItem('preferredLanguage');
            if (lang && typeof changeLanguage === 'function') changeLanguage(lang);
        } catch (e) {}
    }

    function build() {
        stripOld();
        document.body.insertAdjacentHTML('afterbegin', headerHtml());
        document.body.insertAdjacentHTML('beforeend', footerHtml());
        wire();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
    else build();
})();
