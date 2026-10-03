// src/lib/mock-integrations.ts
// Realistic mock responses matching real ServiceNow & Jira API contracts
// When you get real credentials, swap pushToServiceNow/pushToJira in sync/route.ts

export interface SNRiskResult {
  sys_id: string
  number: string
  state: string
  short_description: string
}

export interface SNIncidentResult {
  sys_id: string
  number: string
  state: string
  short_description: string
}

export interface JiraIssueResult {
  id: string
  key: string
  self: string
}

// ── MOCK SERVICENOW ──────────────────────────────────────────────────────────
export function mockServiceNowRisk(item: any): SNRiskResult {
  const sysId = `sn_${item.id?.slice(0, 8) || Math.random().toString(36).slice(2, 10)}`
  const num = `RSK${String(Math.floor(Math.random() * 9000) + 1000)}`
  return {
    sys_id: sysId,
    number: num,
    state: item.status === 'Open' ? '1' : item.status === 'In Progress' ? '2' : '3',
    short_description: `[MIRSAD] ${item.risk_ref}: ${item.title}`,
  }
}

export function mockServiceNowIncident(item: any): SNIncidentResult {
  const sysId = `inc_${item.id?.slice(0, 8) || Math.random().toString(36).slice(2, 10)}`
  const num = `INC${String(Math.floor(Math.random() * 900000) + 100000)}`
  return {
    sys_id: sysId,
    number: num,
    state: '1',
    short_description: `[GRC Finding] ${item.finding_ref}: ${item.title}`,
  }
}

// ── MOCK JIRA ────────────────────────────────────────────────────────────────
export function mockJiraIssue(item: any, projectKey = 'GRC'): JiraIssueResult {
  const issueNum = Math.floor(Math.random() * 900) + 100
  const key = `${projectKey}-${issueNum}`
  return {
    id: String(Math.floor(Math.random() * 900000) + 100000),
    key,
    self: `https://your-domain.atlassian.net/rest/api/3/issue/${key}`,
  }
}

// ── REAL API HELPERS (swap mock→real when credentials available) ─────────────
export async function callServiceNow(
  baseUrl: string, username: string, token: string,
  method: string, path: string, body?: any
) {
  const credentials = Buffer.from(`${username}:${token}`).toString('base64')
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ServiceNow ${res.status}: ${text}`)
  }
  return res.json()
}

export async function callJira(
  baseUrl: string, email: string, token: string,
  method: string, path: string, body?: any
) {
  const credentials = Buffer.from(`${email}:${token}`).toString('base64')
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Jira ${res.status}: ${text}`)
  }
  return res.json()
}

// ── PAYLOAD BUILDERS (used by both mock and real) ────────────────────────────
export function buildSNRiskPayload(item: any) {
  return {
    short_description: `[MIRSAD] ${item.risk_ref}: ${item.title}`,
    description: item.description || item.title,
    category: 'security',
    subcategory: (item.category || 'technical').toLowerCase(),
    priority: item.risk_level === 'Critical' ? '1'
      : item.risk_level === 'High' ? '2'
      : item.risk_level === 'Medium' ? '3' : '4',
    assignment_group: 'GRC Team',
    u_risk_score: String(item.risk_score),
    u_likelihood: String(item.likelihood),
    u_impact: String(item.impact),
    u_treatment: item.treatment,
    u_framework: item.framework_id || '',
    u_due_date: item.due_date || '',
    u_grc_nexus_id: item.id,
    u_source: 'MIRSAD Platform',
  }
}

export function buildSNIncidentPayload(item: any) {
  const severityMap: Record<string, string> = {
    Critical: '1', High: '2', Medium: '3', Low: '4',
  }
  return {
    short_description: `[GRC Finding] ${item.finding_ref}: ${item.title}`,
    description: item.description || item.title,
    category: 'Security',
    urgency: severityMap[item.severity] || '3',
    impact: severityMap[item.severity] || '3',
    assignment_group: 'Security Operations',
    u_framework: item.framework_id || '',
    u_grc_nexus_id: item.id,
    u_source: 'MIRSAD Platform',
  }
}

export function buildJiraFindingPayload(item: any, projectKey: string) {
  const priorityMap: Record<string, string> = {
    Critical: 'Highest', High: 'High', Medium: 'Medium', Low: 'Low',
  }
  return {
    fields: {
      project: { key: projectKey },
      summary: `[${item.finding_ref}] ${item.title}`,
      description: {
        type: 'doc', version: 1,
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: [
            `Finding: ${item.title}`,
            `Framework: ${item.framework_id || 'N/A'}`,
            `Severity: ${item.severity}`,
            `Due Date: ${item.due_date || 'TBD'}`,
            `AI Rating: ${item.ai_rating || 'Pending review'}`,
            '',
            'Generated by MIRSAD Platform',
          ].join('\n') }],
        }],
      },
      issuetype: { name: 'Bug' },
      priority: { name: priorityMap[item.severity] || 'Medium' },
      labels: ['mirsad', 'security-finding', (item.framework_id || '').toLowerCase()].filter(Boolean),
      duedate: item.due_date || undefined,
    },
  }
}

export function buildJiraRiskPayload(item: any, projectKey: string) {
  const priorityMap: Record<string, string> = {
    Critical: 'Highest', High: 'High', Medium: 'Medium', Low: 'Low',
  }
  return {
    fields: {
      project: { key: projectKey },
      summary: `[${item.risk_ref}] ${item.title}`,
      description: {
        type: 'doc', version: 1,
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: [
            `Risk: ${item.title}`,
            `Score: ${item.risk_score} (${item.risk_level})`,
            `Likelihood: ${item.likelihood}/5 | Impact: ${item.impact}/5`,
            `Treatment: ${item.treatment}`,
            `Owner: ${item.owner_name || 'Unassigned'}`,
            '',
            'Generated by MIRSAD Platform',
          ].join('\n') }],
        }],
      },
      issuetype: { name: 'Task' },
      priority: { name: priorityMap[item.risk_level] || 'Medium' },
      labels: ['mirsad', 'risk', (item.category || '').toLowerCase()].filter(Boolean),
      duedate: item.due_date || undefined,
    },
  }
}
