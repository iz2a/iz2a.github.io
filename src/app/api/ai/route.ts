import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

const GRC_SYSTEM = `You are a senior GRC specialist with 15+ years in Saudi Arabia's cybersecurity regulatory landscape. Deep expertise in NCA ECC v2.0, NCA DCC v1.0, SAMA CSF v1.0 (Level 1-5), ISO 27001:2022, NIST CSF 2.0. Generate professional policy documents, conduct gap analyses, review evidence, answer compliance questions. Always reference specific control IDs. Format in clean markdown.`

function getGroq() {
  const key = process.env.GROQ_API_KEY
  if (!key) return null
  return new Groq({ apiKey: key })
}

// Primary model is configurable via GROQ_MODEL. Some accounts cannot access the
// older default and get a model_not_found error, so we fall back automatically
// to a model every account can use.
const PRIMARY_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
const FALLBACK_MODEL = 'llama-3.1-8b-instant'

async function generate(msgs: { role: string; content: string }[]): Promise<string> {
  const groq = getGroq()
  if (!groq) throw new Error('NO_API_KEY')
  const run = (model: string) => groq.chat.completions.create({
    model, messages: msgs as any, max_tokens: 3000, temperature: 0.3,
  })
  try {
    const res = await run(PRIMARY_MODEL)
    return res.choices[0]?.message?.content || ''
  } catch (e: any) {
    const msg = String(e?.message || e)
    // Retry once on an access/availability error with the universally available model.
    if (/model_not_found|does not exist|do not have access|decommission|deprecat/i.test(msg) && PRIMARY_MODEL !== FALLBACK_MODEL) {
      const res = await run(FALLBACK_MODEL)
      return res.choices[0]?.message?.content || ''
    }
    throw e
  }
}

async function safeInsert(client: any, table: string, data: any) {
  try {
    const result = await client.from(table).insert(data)
    return result
  } catch (_) {
    return null
  }
}

async function safeUpdate(client: any, table: string, data: any, match: Record<string, any>) {
  try {
    let q = client.from(table).update(data)
    for (const [k, v] of Object.entries(match)) q = q.eq(k, v)
    return await q
  } catch (_) {
    return null
  }
}

// ── guest rate limiting ──────────────────────────────────────────────────────
// Best-effort, per-IP, in-memory. Keeps an unauthenticated visitor (or a bot)
// from running up the AI bill. Tune with GUEST_AI_RATELIMIT (requests/hour).
const PUBLIC_MODE = (process.env.NEXT_PUBLIC_PUBLIC_MODE ?? 'true').toLowerCase() !== 'false'
const GUEST_AI = (process.env.ALLOW_GUEST_AI ?? 'true').toLowerCase() !== 'false'
const LIMIT = parseInt(process.env.GUEST_AI_RATELIMIT || '15', 10)
const WINDOW = 60 * 60 * 1000
const hits = new Map<string, number[]>()
function rateLimited(ip: string) {
  const now = Date.now()
  const arr = (hits.get(ip) || []).filter(t => now - t < WINDOW)
  if (arr.length >= LIMIT) { hits.set(ip, arr); return true }
  arr.push(now); hits.set(ip, arr)
  if (hits.size > 5000) hits.clear() // crude memory cap
  return false
}

export async function POST(request: NextRequest) {
  const { client, user } = await createAuthClient(request.headers.get('authorization'))
  if (!user) {
    // Guests may use AI only when public mode and guest AI are both enabled.
    if (!PUBLIC_MODE || !GUEST_AI) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'anon'
    if (rateLimited(ip)) return NextResponse.json({ error: 'Rate limit reached. Please try again later, or sign in for full access.' }, { status: 429 })
  }
  if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: 'NO_API_KEY' }, { status: 400 })

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { action, messages, context } = body

  try {

    // ── CHAT ──────────────────────────────────────────────────────────────────
    if (action === 'chat') {
      const text = await generate([
        { role: 'system', content: GRC_SYSTEM },
        ...(messages || [])
      ])
      return NextResponse.json({ content: text })
    }

    // ── GENERATE DOCUMENT ─────────────────────────────────────────────────────
    if (action === 'generate_document') {
      const { template, framework, organization, language } = context
      const text = await generate([
        { role: 'system', content: GRC_SYSTEM },
        { role: 'user', content: `Generate a complete professional ${template.category}: "${template.name}" for "${organization}" in ${language}, fully aligned with ${(framework.id || '').replace(/_/g, ' ')} ${framework.version || ''}.\n\nMust include:\n- Document header: Title, Version 1.0, Date: ${new Date().toISOString().slice(0, 10)}, Owner: CISO, Classification: Confidential\n- 1. Purpose\n- 2. Scope\n- 3. Definitions\n- 4. Policy statements with specific control IDs referenced\n- 5. Roles and Responsibilities\n- 6. Implementation Guidance\n- 7. Compliance and Enforcement\n- 8. Review Schedule\n\nBe detailed and specific to the Saudi regulatory context.` }
      ])
      const { data: profile } = user ? await client.from('profiles').select('organization_id').eq('id', user.id).single() : { data: null }
      if (user && profile?.organization_id) {
        await safeInsert(client, 'documents', {
          organization_id: profile.organization_id,
          title: template.name,
          document_type: template.category,
          framework_id: framework.id,
          language,
          content: text,
          version: '1.0',
          status: 'Draft',
          generated_by_ai: true,
          author_id: user.id,
        })
      }
      return NextResponse.json({ content: text })
    }

    // ── REVIEW EVIDENCE (findings) ────────────────────────────────────────────
    if (action === 'review_evidence') {
      const { finding, framework, evidenceText } = context
      const text = await generate([
        { role: 'system', content: GRC_SYSTEM + '\n\nReturn ONLY valid JSON. No markdown fences.' },
        { role: 'user', content: `Review this evidence and rate the control.\nFramework: ${(framework.id || '').replace(/_/g, ' ')}\nRating Scale: ${(framework.rating_scale || []).join(', ')}\nControl: ${finding.control_ref || finding.domain_ref || 'N/A'} - ${finding.title}\nEvidence: ${evidenceText}\n\nReturn ONLY: {"rating":"<from scale>","confidence":<0-100>,"reasoning":"<2-3 sentences>","gaps":["gap1"],"recommendations":["rec1"]}` }
      ])
      try {
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
        if (user) await safeUpdate(client, 'findings', { ai_rating: parsed.rating, ai_confidence: parsed.confidence, updated_at: new Date().toISOString() }, { id: finding.id })
        return NextResponse.json(parsed)
      } catch {
        return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 })
      }
    }

    // ── RATE EVIDENCE FILE ────────────────────────────────────────────────────
    if (action === 'rate_evidence_file') {
      const { fileDescription, fileName, framework_id, control_ref, controlTitle, controlDesc } = context
      const scaleMap: Record<string, string[]> = {
        NCA_ECC: ['N/A', 'Partially Implemented', 'Fully Implemented'],
        NCA_DCC: ['N/A', 'Partially Implemented', 'Fully Implemented'],
        SAMA_CSF: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'],
        ISO_27001: ['N/A', 'Partially Implemented', 'Fully Implemented'],
        NIST_CSF: ['Partial', 'Risk Informed', 'Repeatable', 'Adaptive'],
      }
      const scale = scaleMap[framework_id] || ['N/A', 'Partially Implemented', 'Fully Implemented']
      const text = await generate([
        { role: 'system', content: GRC_SYSTEM + '\n\nReturn ONLY valid JSON. No markdown fences.' },
        { role: 'user', content: `Review evidence for a cybersecurity compliance assessment.\nFramework: ${(framework_id || '').replace(/_/g, ' ')}\nControl: ${control_ref} - ${controlTitle}\nDescription: ${controlDesc || ''}\nScale: ${scale.join(', ')}\nFile: ${fileName}\nEvidence: ${fileDescription || 'None'}\n\nReturn ONLY: {"rating":"<from scale>","confidence":<0-100>,"reasoning":"<2-3 sentences>","gaps":["gap1","gap2"],"recommendations":["rec1","rec2"]}` }
      ])
      try {
        return NextResponse.json(JSON.parse(text.replace(/```json|```/g, '').trim()))
      } catch {
        return NextResponse.json({ error: 'Parse failed', raw: text }, { status: 500 })
      }
    }

    // ── GENERATE EVIDENCE DOCUMENT ────────────────────────────────────────────
    if (action === 'generate_evidence_doc') {
      const { framework_id, control_ref, controlTitle, controlDesc, organization, docType } = context

      const fwFullNames: Record<string, string> = {
        NCA_ECC: 'NCA Essential Cybersecurity Controls (ECC) v2.0',
        NCA_DCC: 'NCA Data Cybersecurity Controls (DCC) v1.0',
        SAMA_CSF: 'SAMA Cyber Security Framework v1.0',
        ISO_27001: 'ISO/IEC 27001:2022',
        NIST_CSF: 'NIST Cybersecurity Framework 2.0',
      }

      const prompts: Record<string, string> = {
        policy: `Generate a complete, professional POLICY document for the following cybersecurity control, ready to be presented to auditors and regulators.

Organization: ${organization}
Framework: ${fwFullNames[framework_id] || framework_id}
Control Reference: ${control_ref}
Control Title: ${controlTitle}
Control Description: ${controlDesc}
Date: ${new Date().toISOString().slice(0, 10)}

FORMAT EXACTLY AS FOLLOWS (use markdown):

# ${controlTitle} Policy
**Document Reference:** POL-${control_ref.replace(/[.-]/g, '-')}
**Version:** 1.0
**Classification:** Confidential - Internal Use Only
**Effective Date:** ${new Date().toISOString().slice(0, 10)}
**Owner:** Chief Information Security Officer (CISO)
**Approved By:** [Board/Executive Management]
**Next Review:** ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
**Regulatory Reference:** ${fwFullNames[framework_id] || framework_id} - Control ${control_ref}

---

## 1. Purpose
[2-3 sentences explaining why this policy exists and what it protects]

## 2. Scope
[Who and what this policy applies to within the organization]

## 3. Policy Statement
[Clear, enforceable policy statements - use numbered sub-points, be specific]

## 4. Roles and Responsibilities
[Table or list: Role | Responsibility]

## 5. Implementation Requirements
[Specific technical and procedural requirements. Reference the exact control requirements.]

## 6. Compliance Monitoring
[How compliance will be measured, frequency, metrics]

## 7. Exceptions
[Exception process and approval requirements]

## 8. Violations and Consequences
[What happens if policy is violated]

## 9. References
- ${fwFullNames[framework_id] || framework_id}
- Saudi National Cybersecurity Authority Guidelines
- [Other relevant Saudi laws and regulations]

Make it detailed, professional, and specific - not generic. Use Saudi regulatory language where appropriate.`,

        procedure: `Generate a complete PROCEDURE document (step-by-step operational procedure) for implementing the following cybersecurity control.

Organization: ${organization}
Framework: ${fwFullNames[framework_id] || framework_id}
Control Reference: ${control_ref}
Control Title: ${controlTitle}
Control Description: ${controlDesc}
Date: ${new Date().toISOString().slice(0, 10)}

FORMAT EXACTLY AS FOLLOWS:

# ${controlTitle} - Operational Procedure
**Document Reference:** PROC-${control_ref.replace(/[.-]/g, '-')}
**Version:** 1.0
**Classification:** Confidential - Internal Use Only
**Effective Date:** ${new Date().toISOString().slice(0, 10)}
**Process Owner:** [Role]
**Regulatory Reference:** ${fwFullNames[framework_id] || framework_id} - Control ${control_ref}

---

## 1. Purpose and Scope
## 2. Prerequisites
[What must be in place before this procedure runs]
## 3. Procedure Steps
[Numbered step-by-step instructions, very detailed, with sub-steps where needed]
## 4. Roles
[Who performs each step]
## 5. Frequency / Triggers
[When this procedure runs: event-triggered vs. scheduled]
## 6. Evidence and Records
[What records are produced as evidence of compliance]
## 7. Escalation
[When and how to escalate]
## 8. Related Documents
Make it operationally specific and practical for a Saudi organization.`,

        evidence_checklist: `Generate a comprehensive EVIDENCE CHECKLIST for auditors and assessors to verify compliance with the following cybersecurity control.

Organization: ${organization}
Framework: ${fwFullNames[framework_id] || framework_id}
Control Reference: ${control_ref}
Control Title: ${controlTitle}
Control Description: ${controlDesc}

FORMAT EXACTLY AS FOLLOWS:

# Evidence Checklist - ${controlTitle}
**Control Reference:** ${control_ref}
**Framework:** ${fwFullNames[framework_id] || framework_id}
**Assessment Date:** ${new Date().toISOString().slice(0, 10)}
**Assessor:** ___________________________
**Organization:** ${organization}

---

## How to Use This Checklist
Rate each item: ✅ Satisfied | ⚠️ Partially Satisfied | ❌ Not Satisfied | N/A Not Applicable

---

## Evidence Items

For each evidence item provide:
| # | Evidence Required | Acceptable Forms | Rating | Notes |
|---|---|---|---|---|

Include 10-15 specific evidence items covering:
- Documentation evidence (policies, procedures, standards)
- Technical evidence (screenshots, configs, logs, reports)
- Process evidence (meeting minutes, sign-offs, training records)
- Operational evidence (audit logs, monitoring reports, test results)

## Scoring Guide
[How to calculate overall control rating based on checklist results]

## Common Gaps
[3-5 most common deficiencies found during audits of this control]

## Auditor Notes
[Space for notes]

Make it thorough and specific - an auditor should be able to use this without any other reference.`,

        implementation_guide: `Generate a detailed IMPLEMENTATION GUIDE for organizations implementing the following cybersecurity control for the first time or improving their maturity.

Organization: ${organization}
Framework: ${fwFullNames[framework_id] || framework_id}
Control Reference: ${control_ref}
Control Title: ${controlTitle}
Control Description: ${controlDesc}

FORMAT AS FOLLOWS:

# Implementation Guide - ${controlTitle}
**Control:** ${control_ref} | **Framework:** ${fwFullNames[framework_id] || framework_id}
**Difficulty:** [Low/Medium/High] | **Estimated Effort:** [X weeks/months]

---

## 1. Overview
## 2. Current State Assessment
[Questions to assess current maturity]
## 3. Gap Analysis Template
[Common gaps and how to identify them]
## 4. Implementation Roadmap
[Phase 1, Phase 2, Phase 3 with specific tasks and timelines]
## 5. Technical Requirements
[Tools, systems, integrations needed]
## 6. Quick Wins
[What you can do in the first 2 weeks to show progress]
## 7. Common Pitfalls
[What Saudi organizations typically get wrong]
## 8. Maturity Levels
[What Level 1/2/3/4/5 or N/A/Partial/Full looks like for this specific control]
## 9. Evidence to Collect During Implementation
## 10. Validation and Testing

Be specific to Saudi organizations and the ${fwFullNames[framework_id] || framework_id} context.`,
      }

      const prompt = prompts[docType] || prompts.policy
      const text = await generate([
        { role: 'system', content: GRC_SYSTEM },
        { role: 'user', content: prompt }
      ])
      return NextResponse.json({ content: text })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (err: any) {
    console.error('AI route error:', err)
    if (err.message === 'NO_API_KEY') return NextResponse.json({ error: 'NO_API_KEY' }, { status: 400 })
    return NextResponse.json({ error: err.message || 'AI request failed' }, { status: 500 })
  }
}
