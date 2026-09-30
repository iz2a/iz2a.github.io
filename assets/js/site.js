/* ==========================================================================
   aziz.life shared chrome
   Renders the header and footer on every page, handles the EN/AR switch,
   the mobile menu, lab-to-lab navigation and a small toast helper.
   Load with: <script src="<root>/assets/js/site.js" defer></script>
   ========================================================================== */
(function () {
    'use strict';

    const script = document.currentScript || document.querySelector('script[src*="assets/js/site.js"]');
    const ROOT = new URL('../../', script.src).href;
    const url = (p) => ROOT + p;
    const onHome = document.documentElement.hasAttribute('data-home');
    const inLabs = /Interactive_Section|Terminal_Game|\/hack\//.test(location.pathname);

    /* Every lab, in the order used for previous/next links. */
    const LABS = [
        { slug: 'soc-simulation', title: 'SOC Analyst Simulation', href: 'Interactive_Section/html/soc-simulation.html' },
        { slug: 'edr-lab', title: 'Endpoint Defense Lab', href: 'Interactive_Section/html/edr-lab.html' },
        { slug: 'network-toolkit', title: 'Network Security Toolkit', href: 'Interactive_Section/html/network-toolkit.html' },
        { slug: 'fim-challenge', title: 'File Integrity Monitoring', href: 'Interactive_Section/html/fim-challenge.html' },
        { slug: 'automation-workshop', title: 'Security Automation Workshop', href: 'Interactive_Section/html/automation-workshop.html' },
        { slug: 'cloud-security', title: 'Cloud Security Sandbox', href: 'Interactive_Section/html/cloud-security.html' },
        { slug: 'compliance-navigator', title: 'Compliance Navigator', href: 'Interactive_Section/html/compliance-navigator.html' },
        { slug: 'architecture-designer', title: 'Secure Architecture Designer', href: 'Interactive_Section/html/architecture-designer.html' },
        { slug: 'pentest-lab', title: 'Penetration Testing Lab', href: 'Interactive_Section/html/pentest-lab.html' },
        { slug: 'vulnerability-lab', title: 'Vulnerability Assessment Lab', href: 'Interactive_Section/html/vulnerability-lab.html' },
        { slug: 'owasp-workshop', title: 'OWASP Top 10 Workshop', href: 'Interactive_Section/html/owasp-workshop.html' },
        { slug: 'web-hack-challenge', title: 'Web Vulnerability Challenge', href: 'hack/web_hack_challenge.html' },
        { slug: 'ctf-game', title: 'Capture the Flag', href: 'Interactive_Section/html/ctf-game.html' },
        { slug: 'terminal', title: 'Terminal Privilege Escalation', href: 'Terminal_Game/index.html' },
        { slug: 'digital-forensics', title: 'Digital Forensics Case', href: 'Interactive_Section/html/digital-forensics.html' },
        { slug: 'social-engineering-quiz', title: 'Social Engineering Quiz', href: 'Interactive_Section/html/social-engineering-quiz.html' },
        { slug: 'network-playground', title: 'Network Attack Playground', href: 'Interactive_Section/html/network-playground.html' },
        { slug: 'encryption-playground', title: 'Encryption Playground', href: 'Interactive_Section/html/encryption-playground.html' },
        { slug: 'password-security', title: 'Password Security Analyzer', href: 'Interactive_Section/html/password_security.html' },
        { slug: 'blockchain', title: 'Blockchain Explorer', href: 'Interactive_Section/html/blockchain.html' },
        { slug: 'file-converter', title: 'File Converter', href: 'Interactive_Section/html/file-converter.html' }
    ];

    const I18N = {
        en: {
            skip: 'Skip to content', about: 'About', experience: 'Experience', research: 'Research',
            projects: 'Projects', contact: 'Contact', labs: 'Labs', menu: 'Menu', lang: 'Switch to Arabic',
            footAbout: 'IT and information security senior consultant at ECOVIS Al Sabti in Riyadh. SAMA, NCA and ITGC assessments for financial, government and defense-sector clients.',
            site: 'Site', labsTitle: 'Labs', home: 'Home', cv: 'Download CV', privacy: 'Privacy policy',
            allLabs: 'All labs', soc: 'SOC Analyst Simulation', pentest: 'Penetration Testing Lab', grc: 'Compliance Navigator',
            rights: 'Aziz Alghamdi. All rights reserved.', built: 'Built by hand, hosted on GitHub Pages.',
            prev: 'Previous lab', next: 'Next lab'
        },
        ar: {
            skip: 'انتقل إلى المحتوى', about: 'نبذة', experience: 'الخبرة', research: 'الأبحاث',
            projects: 'المشاريع', contact: 'تواصل', labs: 'المختبرات', menu: 'القائمة', lang: 'التبديل إلى الإنجليزية',
            footAbout: 'مستشار أول في تقنية المعلومات وأمن المعلومات لدى إيكوفيس السبتي في الرياض. تقييمات ساما والهيئة الوطنية للأمن السيبراني وضوابط تقنية المعلومات العامة لعملاء القطاعات المالية والحكومية والدفاعية.',
            site: 'الموقع', labsTitle: 'المختبرات', home: 'الرئيسية', cv: 'تحميل السيرة الذاتية', privacy: 'سياسة الخصوصية',
            allLabs: 'كل المختبرات', soc: 'محاكاة محلل مركز العمليات', pentest: 'مختبر اختبار الاختراق', grc: 'مستكشف الامتثال',
            rights: 'عزيز الغامدي. جميع الحقوق محفوظة.', built: 'صُمم يدويًا ويُستضاف على GitHub Pages.',
            prev: 'المختبر السابق', next: 'المختبر التالي'
        }
    };

    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const home = (hash) => onHome ? hash : url('index.html' + hash);

    function headerHTML() {
        return `
<a class="sx-skip" href="#main" data-t="skip">Skip to content</a>
<header class="sx-header" id="sx-header">
  <div class="sx-wrap sx-header__inner">
    <a class="sx-brand" href="${url('index.html')}" aria-label="Aziz Alghamdi, home">
      <span class="sx-brand__mark" aria-hidden="true">ع</span>
      <span class="sx-brand__name">Aziz Alghamdi</span>
      <span class="sx-brand__ar" lang="ar">عزيز الغامدي</span>
    </a>
    <nav class="sx-nav" id="sx-nav" aria-label="Primary">
      <ul>
        <li><a href="${home('#about')}" data-t="about">About</a></li>
        <li><a href="${home('#experience')}" data-t="experience">Experience</a></li>
        <li><a href="${home('#research')}" data-t="research">Research</a></li>
        <li><a href="${home('#projects')}" data-t="projects">Projects</a></li>
        <li><a href="${home('#contact')}" data-t="contact">Contact</a></li>
        <li><a class="sx-nav__labs" href="${url('Interactive_Section/html/interactive-section.html')}" ${inLabs ? 'aria-current="page"' : ''}><i class="fas fa-flask" aria-hidden="true"></i><span data-t="labs">Labs</span></a></li>
      </ul>
    </nav>
    <div class="sx-header__tools">
      <button class="sx-lang" type="button" id="sx-lang" aria-label="Switch to Arabic"><span class="sx-lang__ar" lang="ar">ع</span></button>
      <button class="sx-menu" type="button" id="sx-menu" aria-controls="sx-nav" aria-expanded="false" aria-label="Menu"><span></span></button>
    </div>
  </div>
</header>`;
    }

    function footerHTML() {
        const year = new Date().getFullYear();
        return `
<footer class="sx-footer" id="sx-footer">
  <div class="sx-wrap">
    <div class="sx-footer__grid">
      <div>
        <h2>Aziz Alghamdi <span lang="ar" style="font-family:var(--font-ar);color:var(--muted);font-weight:500">عزيز الغامدي</span></h2>
        <p data-t="footAbout"></p>
        <div class="sx-social">
          <a href="https://linkedin.com/in/abdulaziz-alghamdi-525810360" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
          <a href="https://github.com/iz2a" target="_blank" rel="noopener" aria-label="GitHub"><i class="fab fa-github"></i></a>
          <a href="https://www.researchgate.net/profile/Aziz-Alghamdi-3" target="_blank" rel="noopener" aria-label="ResearchGate"><i class="fab fa-researchgate"></i></a>
          <a href="mailto:azizcsecj@gmail.com" aria-label="Email"><i class="fas fa-envelope"></i></a>
        </div>
      </div>
      <div>
        <h2 data-t="site">Site</h2>
        <ul>
          <li><a href="${url('index.html')}" data-t="home">Home</a></li>
          <li><a href="${home('#experience')}" data-t="experience">Experience</a></li>
          <li><a href="${home('#research')}" data-t="research">Research</a></li>
          <li><a href="${url('My_Resume.pdf')}" data-t="cv">Download CV</a></li>
          <li><a href="${url('Privacy_Policy.pdf')}" data-t="privacy">Privacy policy</a></li>
        </ul>
      </div>
      <div>
        <h2 data-t="labsTitle">Labs</h2>
        <ul>
          <li><a href="${url('Interactive_Section/html/interactive-section.html')}" data-t="allLabs">All labs</a></li>
          <li><a href="${url('Interactive_Section/html/soc-simulation.html')}" data-t="soc">SOC Analyst Simulation</a></li>
          <li><a href="${url('Interactive_Section/html/pentest-lab.html')}" data-t="pentest">Penetration Testing Lab</a></li>
          <li><a href="${url('Interactive_Section/html/compliance-navigator.html')}" data-t="grc">Compliance Navigator</a></li>
        </ul>
      </div>
    </div>
    <div class="sx-footer__base">
      <span>&copy; ${year} <span data-t="rights">Aziz Alghamdi. All rights reserved.</span></span>
      <span data-t="built">Built by hand, hosted on GitHub Pages.</span>
    </div>
  </div>
</footer>`;
    }

    function labNavHTML(slug) {
        const i = LABS.findIndex((l) => l.slug === slug);
        if (i < 0) return '';
        const prev = LABS[(i - 1 + LABS.length) % LABS.length];
        const next = LABS[(i + 1) % LABS.length];
        return `<nav class="sx-wrap sx-labnav" aria-label="Lab navigation">
  <a href="${url(prev.href)}"><i class="fas fa-arrow-left" aria-hidden="true"></i><span><span data-t="prev">Previous lab</span>: ${esc(prev.title)}</span></a>
  <a href="${url(next.href)}"><span><span data-t="next">Next lab</span>: ${esc(next.title)}</span><i class="fas fa-arrow-right" aria-hidden="true"></i></a>
</nav>`;
    }

    /* ---------- language ---------- */
    function getLang() {
        try { return localStorage.getItem('preferredLanguage') === 'ar' ? 'ar' : 'en'; } catch (e) { return 'en'; }
    }
    function setLang(lang) {
        const dict = I18N[lang] || I18N.en;
        const pageRtl = document.body.hasAttribute('data-i18n-page');
        document.documentElement.lang = lang;
        document.documentElement.dir = (lang === 'ar' && pageRtl) ? 'rtl' : 'ltr';
        ['sx-header', 'sx-footer'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.dir = lang === 'ar' ? 'rtl' : 'ltr';
        });
        document.querySelectorAll('[data-t]').forEach((el) => {
            const k = el.getAttribute('data-t');
            if (dict[k] != null) el.textContent = dict[k];
        });
        /* page content: elements carrying data-en / data-ar pairs */
        document.querySelectorAll('[data-ar]').forEach((el) => {
            if (!el.hasAttribute('data-en')) el.setAttribute('data-en', el.textContent.trim());
            const val = el.getAttribute(lang === 'ar' ? 'data-ar' : 'data-en');
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') { el.placeholder = val; return; }
            el.textContent = val;
            if (!pageRtl) el.dir = lang === 'ar' ? 'rtl' : '';
        });
        const btn = document.getElementById('sx-lang');
        if (btn) {
            btn.innerHTML = lang === 'ar' ? 'EN' : '<span class="sx-lang__ar" lang="ar">ع</span>';
            btn.setAttribute('aria-label', dict.lang);
        }
        try { localStorage.setItem('preferredLanguage', lang); } catch (e) { /* storage unavailable */ }
        document.dispatchEvent(new CustomEvent('sx:lang', { detail: { lang } }));
    }

    /* ---------- toasts ---------- */
    function toast(message, type) {
        let box = document.querySelector('.sx-toasts');
        if (!box) {
            box = document.createElement('div');
            box.className = 'sx-toasts';
            box.setAttribute('role', 'status');
            box.setAttribute('aria-live', 'polite');
            document.body.appendChild(box);
        }
        const t = document.createElement('div');
        t.className = 'sx-toast' + (type ? ' sx-toast--' + type : '');
        t.textContent = message;
        box.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 3200);
        setTimeout(() => t.remove(), 3600);
    }

    /* ---------- boot ---------- */
    function boot() {
        if (!document.getElementById('sx-header') && !document.body.hasAttribute('data-no-chrome')) {
            document.body.insertAdjacentHTML('afterbegin', headerHTML());
        }
        const lab = document.body.getAttribute('data-lab');
        if (lab && !document.querySelector('.sx-labnav')) {
            (document.getElementById('main') || document.body).insertAdjacentHTML('beforeend', labNavHTML(lab));
        }
        if (!document.getElementById('sx-footer') && !document.body.hasAttribute('data-no-chrome') && !document.body.hasAttribute('data-no-footer')) {
            document.body.insertAdjacentHTML('beforeend', footerHTML());
        }

        const menu = document.getElementById('sx-menu');
        const nav = document.getElementById('sx-nav');
        if (menu && nav) {
            menu.addEventListener('click', () => {
                const open = nav.classList.toggle('is-open');
                menu.setAttribute('aria-expanded', String(open));
            });
            nav.addEventListener('click', (e) => {
                if (e.target.closest('a')) { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); }
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && nav.classList.contains('is-open')) { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); menu.focus(); }
            });
        }
        const langBtn = document.getElementById('sx-lang');
        if (langBtn) langBtn.addEventListener('click', () => setLang(document.documentElement.lang === 'ar' ? 'en' : 'ar'));
        setLang(getLang());

        /* highlight the section in view on the home page */
        if (onHome && 'IntersectionObserver' in window) {
            const links = Array.from(document.querySelectorAll('.sx-nav a[href^="#"]'));
            const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
            const io = new IntersectionObserver((entries) => {
                entries.forEach((en) => {
                    if (en.isIntersecting) {
                        links.forEach((a) => a.classList.remove('is-active'));
                        const a = map.get(en.target.id);
                        if (a) a.classList.add('is-active');
                    }
                });
            }, { rootMargin: '-45% 0px -50% 0px' });
            map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
        }
    }

    window.SX = { toast, setLang, getLang, root: ROOT, labs: LABS };
    /* keep the old global used by some pages */
    window.changeLanguage = setLang;

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
