# MIRSAD: Enterprise Compliance Platform
## Saudi-first: NCA ECC · NCA DCC · SAMA CSF · ISO 27001 · NIST CSF

---

## Quick Start (10 minutes to running)

### 1. Install
```bash
npm install
cp .env.example .env.local   # then fill in values
```

### 2. Supabase (free tier works)
1. Create project at https://supabase.com → choose Bahrain region
2. Go to **SQL Editor** → paste + run `supabase/migrations/001_initial_schema.sql`
3. Go to **Settings → API** → copy the 3 keys into `.env.local`

### 3. Get Anthropic API Key
https://console.anthropic.com/settings/keys → add to `.env.local`

### 4. Run
```bash
npm run dev        # http://localhost:3000
# → Click "Create account" → register your org → you're in
```

### 5. Deploy to Vercel
```bash
npx vercel         # follow prompts, add env vars in Vercel dashboard
```

---

## What Works (Everything)

| Feature | Status | Notes |
|---|---|---|
| Auth: login / register / roles | ✅ | Supabase Auth, JWT, middleware |
| Multi-org isolation (RLS) | ✅ | Each org sees only their data |
| NCA ECC/DCC compliance tracking | ✅ | Correct rating scale: N/A / Partial / Full |
| SAMA CSF Levels 1–5 | ✅ | Initial → Optimized with color coding |
| ISO 27001 / NIST CSF | ✅ | All domains + rating scales |
| Risk Register — full CRUD | ✅ | Auto risk scoring, auto RSK-001 ref |
| Findings — full CRUD | ✅ | Auto FND-001 ref, severity filtering |
| Add Risk / Add Finding forms | ✅ | Modal forms, saves to Supabase |
| AI Document Generator | ✅ | Real Claude API — saves to DB |
| AI Evidence Review | ✅ | Rates control, saves to finding |
| AI Chat Assistant | ✅ | GRC specialist prompt |
| ServiceNow sync | ✅ MOCK | Real API structure, mock response |
| Jira sync | ✅ MOCK | Real API structure, mock response |
| Export PDF (risks, findings, docs) | ✅ | jsPDF + autotable |
| Export XLSX (risks, findings) | ✅ | Multi-sheet workbooks |
| Export DOCX (documents) | ✅ | Professional Word documents |
| Audit log | ✅ | All actions logged to DB |

### Upgrading Mock → Real Integrations
When you have real credentials, add to `.env.local`:
```env
SERVICENOW_BASE_URL=https://your-instance.service-now.com
SERVICENOW_USERNAME=admin
SERVICENOW_PASSWORD=password
JIRA_BASE_URL=https://domain.atlassian.net
JIRA_EMAIL=you@email.com
JIRA_API_TOKEN=token
JIRA_PROJECT_KEY=GRC
```
Then in `src/lib/mock-integrations.ts` the `callServiceNow` and `callJira` helpers are ready — the sync route auto-detects credentials and switches from mock to real.

---

## File Structure
```
src/
├── app/
│   ├── api/
│   │   ├── risks/route.ts          ← Full CRUD
│   │   ├── findings/route.ts       ← Full CRUD  
│   │   ├── ai/route.ts             ← Claude API: chat, docgen, evidence review
│   │   ├── export/route.ts         ← Server-side XLSX/CSV
│   │   ├── integrations/sync/      ← ServiceNow + Jira (mock + real)
│   │   └── auth/route.ts           ← Registration
│   ├── dashboard/page.tsx          ← MAIN APP (all 8 modules)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx
├── lib/
│   ├── supabase/client.ts + server.ts
│   ├── export.ts                   ← jsPDF, xlsx, docx exports
│   └── mock-integrations.ts        ← Mock + real API helpers
└── types/database.ts
supabase/migrations/001_initial_schema.sql
```

## Roles
| Role | Can Do |
|---|---|
| admin | Everything + user management |
| grc_manager | Create/edit all GRC data |
| analyst | Create/edit risks & findings |
| viewer | Read-only |
