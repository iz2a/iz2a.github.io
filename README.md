# aziz.life

Personal site and cybersecurity learning labs for Abdulaziz Alghamdi, IT and Information Security Senior Consultant based in Riyadh. Hosted on GitHub Pages at [aziz.life](https://aziz.life).

## What is here

- A single-page portfolio covering experience, research, projects and credentials, in English and Arabic.
- A set of interactive, browser-only security labs under `Interactive_Section/`, including a SOC analyst simulation (Raqib SIEM) modeled on Splunk and QRadar, a penetration testing lab, a compliance navigator, an OWASP Top 10 workshop, and more.

Everything runs client-side. There is no backend and no build step; the labs generate their data in the browser.

## Structure

- `index.html` plus `assets/css/` and `assets/js/` hold the home page and the shared design system.
- `assets/js/site.js` injects the shared header, footer and English/Arabic switch on every page.
- `assets/css/site.css` is the shared design system; `assets/css/lab-theme.css` re-skins the individual labs to match it.
- `Interactive_Section/html/` holds each lab page, with matching CSS and JS in the sibling `css/` and `javascript/` folders.
- `Terminal_Game/` and `hack/` are two standalone challenge pages.
- `research/` holds published papers linked from the home page.

## Local preview

Serve the folder with any static server, for example:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Fonts and icons

IBM Plex (Sans, Mono and Arabic) and Font Awesome are self-hosted under `assets/fonts/` and `assets/vendor/`, so the site has no third-party runtime dependencies.
