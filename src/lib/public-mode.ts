// ==========================================================================
// public-mode.ts
// Lets anyone use MIRSAD without signing in. When public mode is on, the
// dashboard runs against a local, in-browser demo workspace instead of
// Supabase: seeded sample GRC data that each visitor can read and edit, saved
// to their own browser via localStorage. Nothing here touches the database, so
// one visitor never sees another's changes and no account is needed.
//
// Turn it off by setting NEXT_PUBLIC_PUBLIC_MODE=false in the environment; the
// app then requires sign-in exactly as before.
// ==========================================================================

export const PUBLIC_MODE =
  (process.env.NEXT_PUBLIC_PUBLIC_MODE ?? 'true').toLowerCase() !== 'false'

// A guest "identity" the UI can show. It is not a real account and has no
// database access. Role is admin so the guest can try every screen.
export const GUEST_ORG = {
  id: 'demo-org',
  name: 'GulfPay (Demo)',
  name_ar: 'جلف باي (تجريبي)',
  sector: 'Financial / Banking',
  license_number: 'DEMO-0000',
}

export const GUEST_PROFILE = {
  id: 'demo-guest',
  full_name: 'Guest',
  email: 'guest@demo.local',
  role: 'admin',
  organization_id: GUEST_ORG.id,
  avatar_url: null,
  is_guest: true,
}

// Set by the dashboard once it knows whether this visitor is a guest, so that
// deeply-nested forms can persist locally without threading a prop everywhere.
let _guestActive = false
export function setGuestActive(v: boolean) { _guestActive = v }
export function isGuest() { return PUBLIC_MODE && _guestActive }

function uid(prefix = 'id') {
  return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

// ── local store ────────────────────────────────────────────────────────────
const KEY = 'mirsad_demo_'

function read<T>(col: string): T[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY + col)
    return raw ? (JSON.parse(raw) as T[]) : null
  } catch { return null }
}
function write<T>(col: string, rows: T[]) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(KEY + col, JSON.stringify(rows)) } catch {}
}

// Returns the collection, seeding it on first access.
export function demoList<T = any>(col: string, seed: () => T[] = () => []): T[] {
  let rows = read<T>(col)
  if (rows === null) { rows = seed(); write(col, rows) }
  return rows
}

export function demoInsert<T extends Record<string, any>>(col: string, row: T, refField?: string, refPrefix?: string): T {
  const rows = demoList<T>(col)
  const withId: any = { id: uid(col.slice(0, 3)), created_at: new Date().toISOString(), ...row }
  if (refField && !withId[refField]) {
    withId[refField] = (refPrefix || 'REF') + '-' + String(rows.length + 1).padStart(3, '0')
  }
  if ('likelihood' in withId && 'impact' in withId) {
    const s = (Number(withId.likelihood) || 0) * (Number(withId.impact) || 0)
    withId.risk_score = s
    withId.risk_level = s >= 15 ? 'Critical' : s >= 10 ? 'High' : s >= 6 ? 'Medium' : 'Low'
  }
  const next = [withId, ...rows]
  write(col, next)
  return withId
}

export function demoUpdate<T extends Record<string, any>>(col: string, id: string, patch: Partial<T>): T | null {
  const rows = demoList<T>(col)
  let updated: T | null = null
  const next = rows.map(r => {
    if ((r as any).id !== id) return r
    updated = { ...r, ...patch, updated_at: new Date().toISOString() }
    return updated as T
  })
  write(col, next)
  return updated
}

export function demoDelete(col: string, id: string) {
  write(col, demoList(col).filter((r: any) => r.id !== id))
}

export function resetDemo() {
  if (typeof window === 'undefined') return
  ;['risks', 'findings', 'kpi_kri', 'evidence_files', 'profiles'].forEach(c => {
    try { window.localStorage.removeItem(KEY + c) } catch {}
  })
}

// ── seed data (sample GRC workspace, no real client information) ─────────────
export function seedRisks() {
  const base = [
    { title: 'Unpatched internet-facing VPN gateway', description: 'The remote-access gateway is two firmware versions behind, with a known authentication-bypass advisory outstanding.', framework_id: 'NCA_ECC', category: 'Technical', likelihood: 4, impact: 5, status: 'Open', owner_name: 'IT Operations' },
    { title: 'No MFA on privileged cloud accounts', description: 'Several administrator accounts in the cloud tenant sign in with a password only.', framework_id: 'SAMA_CSF', category: 'Technical', likelihood: 4, impact: 4, status: 'In Progress', owner_name: 'Cloud Team' },
    { title: 'Third-party processor without signed DPA', description: 'A payment-reconciliation vendor handles cardholder data with no data-processing agreement on file.', framework_id: 'NCA_DCC', category: 'Third-Party', likelihood: 3, impact: 5, status: 'Open', owner_name: 'Procurement' },
    { title: 'Backups never restored in a test', description: 'Nightly backups run, but a restore has not been exercised in the last 12 months.', framework_id: 'ISO_27001', category: 'Operational', likelihood: 3, impact: 4, status: 'Open', owner_name: 'Infrastructure' },
    { title: 'Shared service account for the core banking job', description: 'A single non-named account runs scheduled jobs, so activity cannot be traced to a person.', framework_id: 'NCA_ECC', category: 'People', likelihood: 3, impact: 3, status: 'Mitigated', owner_name: 'Application Support' },
    { title: 'Security awareness training below target', description: 'Annual training completion sits at 62 percent against a 100 percent policy target.', framework_id: 'SAMA_CSF', category: 'People', likelihood: 2, impact: 3, status: 'In Progress', owner_name: 'HR / Security' },
  ]
  let n = 0
  return base.map(r => {
    const s = r.likelihood * r.impact
    n += 1
    return {
      id: 'risk-seed-' + n,
      risk_ref: 'RSK-' + String(n).padStart(3, '0'),
      risk_score: s,
      risk_level: s >= 15 ? 'Critical' : s >= 10 ? 'High' : s >= 6 ? 'Medium' : 'Low',
      created_at: new Date(Date.now() - n * 86400000).toISOString(),
      ...r,
    }
  })
}

export function seedFindings() {
  const base = [
    { title: 'Access reviews not performed quarterly', description: 'User access recertification is overdue for the core banking and HR systems.', severity: 'High', framework_id: 'NCA_ECC', control_ref: '2-2', status: 'Open' },
    { title: 'Firewall rule base contains any-any rules', description: 'The perimeter firewall has several permissive any-any rules with no business justification recorded.', severity: 'Critical', framework_id: 'SAMA_CSF', control_ref: 'CS-3', status: 'Open' },
    { title: 'Log retention shorter than policy', description: 'Security event logs are retained for 30 days against a 12-month requirement.', severity: 'Medium', framework_id: 'ISO_27001', control_ref: 'A.8', status: 'In Progress' },
    { title: 'Data classification labels inconsistent', description: 'Confidential documents in shared drives are frequently unlabelled.', severity: 'Medium', framework_id: 'NCA_DCC', control_ref: 'DC-2', status: 'Open' },
    { title: 'Incident response plan not tested', description: 'The IR plan exists but no tabletop exercise has been run this year.', severity: 'High', framework_id: 'NIST_CSF', control_ref: 'RS', status: 'Open' },
    { title: 'Vulnerability scan findings aging', description: 'High-severity scan findings remain open beyond the 30-day SLA.', severity: 'High', framework_id: 'NCA_ECC', control_ref: '2-3', status: 'Resolved' },
    { title: 'Privileged activity not monitored', description: 'Administrator sessions on the domain controllers are not recorded or reviewed.', severity: 'Critical', framework_id: 'SAMA_CSF', control_ref: 'CS-3', status: 'In Progress' },
  ]
  let n = 0
  return base.map(f => {
    n += 1
    return { id: 'find-seed-' + n, finding_ref: 'FND-' + String(n).padStart(3, '0'), created_at: new Date(Date.now() - n * 43200000).toISOString(), ...f }
  })
}
