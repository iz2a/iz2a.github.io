# aziz.life visitor tracker

First-party visitor analytics for aziz.life with real-time Telegram and ntfy
alerts. A small script on the site (`/tracker.js`) sends a beacon on each page
view; a Cloudflare Worker enriches it with IP, geo and network data from the
real connection, stores it in a D1 database, and pings you.

## What it collects

Per visit:

- Network (added server side by Cloudflare): IP address, country, region, city,
  ASN and ISP/organisation, Cloudflare edge location, HTTP protocol, TLS version.
- Browser-reported: page path and title, referrer, UTM tags, screen and viewport
  size, device pixel ratio, languages, timezone, platform, touch support, device
  type, user agent.
- Behaviour: clicks on links and buttons, scroll depth, time on page, language
  switches, JS errors.
- A random visitor id (localStorage + cookie) and a session id so returning
  visitors are recognised.

What it does **not** do: no canvas/WebGL/audio/font fingerprinting, no attempt to
re-identify a visitor who clears their storage, and no attempt to unmask VPNs or
pull local IPs over WebRTC. It honours an opt-out and the Global Privacy Control
signal. A visitor who clears cookies is counted as new.

## One-time setup

You need a (free) Cloudflare account and Node.js installed locally.

### 1. Install Wrangler and sign in

```bash
cd tracker
npm install -g wrangler        # or: npx wrangler ...
wrangler login
```

### 2. Create the database

```bash
wrangler d1 create aziz-tracker
```

Copy the `database_id` it prints into `wrangler.toml` (replace
`REPLACE_WITH_YOUR_D1_DATABASE_ID`). Then create the tables:

```bash
wrangler d1 execute aziz-tracker --remote --file=schema.sql
```

### 3. Set the secrets

```bash
wrangler secret put DASHBOARD_PASSWORD     # password for the dashboard
wrangler secret put TELEGRAM_BOT_TOKEN     # from @BotFather
wrangler secret put TELEGRAM_CHAT_ID       # your id from @userinfobot
wrangler secret put NTFY_TOPIC             # a long, private topic name you pick
# optional, only if your ntfy topic is access-protected:
wrangler secret put NTFY_TOKEN
```

Getting the Telegram values:

1. Open Telegram, message **@BotFather**, send `/newbot`, follow the prompts, copy
   the bot token.
2. Send any message to your new bot first (bots cannot start chats).
3. Message **@userinfobot** to get your numeric chat id.

For ntfy: install the ntfy app, pick a hard-to-guess topic name (for example
`aziz-life-7f3k9q2x`), subscribe to it in the app, and use that same name as
`NTFY_TOPIC`. Anyone who knows the topic can read it, so keep it secret or run a
protected topic with a token.

### 4. Deploy

```bash
wrangler deploy
```

Wrangler prints a URL like `https://aziz-tracker.<your-subdomain>.workers.dev`.

- Put that origin into `PUBLIC_URL` in `wrangler.toml` (so alert links work),
  then `wrangler deploy` once more.
- Put the full `/collect` URL into `tracker.js` as `DEFAULT_ENDPOINT`, or set it
  on the script tag with `data-endpoint`.

### 5. Add the script to the site

Already done in this PR: `tracker.js` is referenced from every page. Just make
sure `DEFAULT_ENDPOINT` (or the `data-endpoint` attribute) points at your Worker.

### 6. (Recommended) Put the Worker on your own subdomain

Ad blockers block `*.workers.dev` far more than a first-party host. If aziz.life
is on Cloudflare DNS, add a route so the Worker answers on `t.aziz.life`, then
set the endpoint to `https://t.aziz.life/collect`. See the Cloudflare dashboard
under Workers Routes, or add a `routes` entry in `wrangler.toml`.

## Using it

- Dashboard: `https://<your-worker>/dashboard` (log in with `aziz` and your
  `DASHBOARD_PASSWORD`). Overview, visitors, per-visitor history, per-IP view,
  CSV export.
- Alerts arrive on Telegram and ntfy on every human page view. Bots are stored
  but not alerted unless you set `NOTIFY_BOTS = "true"` in `wrangler.toml`.

## Tuning the noise

"Every page view" gets busy once crawlers find the site. Options, in
`wrangler.toml` or the code:

- `NOTIFY_BOTS` already defaults to `false`, so known crawlers do not alert.
- To alert only on the first page of each visit, move the notify call in
  `src/index.js` behind `if (isNewSession)`.
- To alert only for specific pages, check `event.path` before notifying.

## Local development

```bash
cd tracker
npm install
npm test                       # unit tests for UA parsing, bot detection, alerts
wrangler dev --local           # runs the Worker against a local D1
```

With `wrangler dev` running you can fire a test beacon:

```bash
curl -X POST http://127.0.0.1:8787/collect \
  -H 'content-type: application/json' \
  -H 'origin: http://localhost:8080' \
  -d '{"type":"pageview","visitorId":"aaaaaaaaaaaaaaaa","sessionId":"bbbbbbbbbbbb","path":"/","title":"Home","data":{"screen":{"w":1920,"h":1080,"dpr":1},"languages":["en"],"timezone":"Asia/Riyadh"}}'
```

## Data and privacy

This stores IP addresses and location, which are personal data under Saudi PDPL
and most other regimes. A visitor-facing notice is included at
`/tracker-privacy.html` and linked from the site footer. Review it and set a
retention period that suits you; a scheduled cleanup query you can run from
`wrangler d1 execute` is noted at the bottom of `schema.sql` territory in the
privacy page. Keep the dashboard password and bot tokens private.
