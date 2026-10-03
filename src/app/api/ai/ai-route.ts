import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

const GRC_SYSTEM = `You are a senior GRC specialist with 15+ years in Saudi Arabia's cybersecurity regulatory landscape. Deep expertise in NCA ECC v2.0, NCA DCC v1.0, SAMA CSF v1.0 (Level 1-5), ISO 27001:2022, NIST CSF 2.0. Generate professional policy documents, conduct gap analyses, review evidence, answer compliance questions. Always reference specific control IDs. Format in clean markdown.`

function getGroq() {
  const key = process.env.GROQ_API_KEY
  if (!key) return null
  return new Groq({ apiKey: key })
}

async function generate(messages: any[]): Promise<string> {
  const groq = getGroq()
  if (!groq) throw new Error('NO_API_KEY')
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    max_tokens: 3000,
    temperature: 0.3,
  })
  return res.choices[0]?.message?.content || ''
}

export async function POST(request: NextRequest) {
  const { client, user } = await createAuthClient(request.headers.get('authorization'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.GROQ_API_KEY) return NextResponse.json({ error: 'NO_API_KEY' }, { status: 400 })

  const body = await request.json()
  const { action, messages, context } = body

  try {
    if (action === 'chat') {
      const text = await generate([{ role: 'system', content: GRC_SYSTEM }, ...(messages || [])])
      return NextResponse.json({ content: text })
    }

    if (action === 'generate_document') {
      const { template, framework, organization, language } = context
      const text = await generate([
        { role: 'system', content: GRC_SYSTEM },
        { role: 'user', content: `Generate a complete professional ${template.category}: "${template.name}" for "${organization}" in ${language}, aligned with ${framework.id.replace(/_/g,' ')}. Include: document header (Title, Version 1.0, Date, Owner, Classification: Confidential), Purpose, Scope, Definitions, Policy statements with specific control IDs, Roles and Responsibilities, Implementation guidance, Review schedule.` }
      ])
      const { data: profile } = await client.from('profiles').select('organization_id').eq('id', user.id).single()
      if (profile?.organization_id) {
        try { await client.from('documents').insert({ organization_id: profile.organization_id, title: template.name, document_type: template.category, framework_id: framework.id, language, content: text, version: '1.0', status: 'Draft', generated_by_ai: true, author_id: user.id }) } catch (_) {}
      }
      return NextResponse.json({ content: text })
    }

    if (action === 'review_evidence') {
      const { finding, framework, evidenceText } = context
      const text = await generate([
        { role: 'system', content: GRC_SYSTEM + '\n\nReturn ONLY valid JSON. No markdown fences.' },
        { role: 'user', content: `Review evidence and rate control. Return ONLY JSON.\nFramework: ${(framework.id||'').replace(/_/g,' ')}\nRating Scale: ${(framework.rating_scale||[]).join(', ')}\nFinding/Control: ${finding.title}\nControl Ref: ${finding.control_ref||finding.domain_ref||'N/A'}\nEvidence: ${evidenceText}\n\nReturn: {"rating":"<from scale>","confidence":<0-100>,"reasoning":"<2-3 sentences>","gaps":["gap1"],"recommendations":["rec1"]}` }
      ])
      try {
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
        try { await client.from('findings').update({ ai_rating: parsed.rating, ai_confidence: parsed.confidence, updated_at: new Date().toISOString() }).eq('id', finding.id) } catch (_) {}
        return NextResponse.json(parsed)
      } catch { return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 }) }
    }

    if (action === 'rate_evidence_file') {
      const { fileDescription, fileName, framework_id, control_ref, controlTitle, controlDesc } = context
      const fwScales: Record<string,string[]> = {
        NCA_ECC: ['N/A','Partially Implemented','Fully Implemented'],
        NCA_DCC: ['N/A','Partially Implemented','Fully Implemented'],
        SAMA_CSF: ['Level 1','Level 2','Level 3','Level 4','Level 5'],
        ISO_27001: ['N/A','Partially Implemented','Fully Implemented'],
        NIST_CSF: ['Partial','Risk Informed','Repeatable','Adaptive'],
      }
      const scale = fwScales[framework_id] || ['N/A','Partially Implemented','Fully Implemented']
      const text = await generate([
        { role: 'system', content: GRC_SYSTEM + '\n\nReturn ONLY valid JSON. No markdown fences.' },
        { role: 'user', content: `You are reviewing evidence uploaded for a cybersecurity control assessment.\n\nFramework: ${(framework_id||'').replace(/_/g,' ')}\nControl: ${control_ref} - ${controlTitle}\nControl Description: ${controlDesc||''}\nRating Scale: ${scale.join(', ')}\n\nEvidence File: ${fileName}\nEvidence Description: ${fileDescription||'No description provided'}\n\nBased on this evidence, assess what rating this control likely achieves. Consider: does this evidence demonstrate implementation? Are there obvious gaps?\n\nReturn ONLY: {"rating":"<from scale>","confidence":<0-100>,"reasoning":"<2-3 sentences explaining the rating>","gaps":["specific gap 1","specific gap 2"],"recommendations":["recommendation 1","recommendation 2"]}` }
      ])
      try {
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
        return NextResponse.json(parsed)
      } catch { return NextResponse.json({ error: 'Parse failed', raw: text }, { status: 500 }) }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    console.error('AI error:', err)
    if (err.message === 'NO_API_KEY') return NextResponse.json({ error: 'NO_API_KEY' }, { status: 400 })
    return NextResponse.json({ error: err.message || 'AI request failed' }, { status: 500 })
  }
}
