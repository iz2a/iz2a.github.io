import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// GET: library test (existing)
export async function GET(request: NextRequest) {
  return NextResponse.json({ docx_full: 'OK', pdf_full: 'OK' })
}

// POST: simulate the exact export route flow with auth
export async function POST(request: NextRequest) {
  const steps: Record<string, string> = {}

  try {
    // Step 1: auth
    const authHeader = request.headers.get('authorization')
    steps.auth_header = authHeader ? `present (${authHeader.slice(0,20)}...)` : 'MISSING'

    const { client, user } = await createAuthClient(authHeader)
    steps.auth_user = user ? `OK - ${user.id}` : 'NULL - no user returned'

    if (!user) {
      return NextResponse.json({ steps, error: 'Auth failed - user is null' })
    }

    // Step 2: parse body
    let body: any
    try {
      body = await request.json()
      steps.body = `OK - format=${body.format} content_len=${body.content?.length}`
    } catch(e: any) {
      steps.body = `FAIL: ${e.message}`
      return NextResponse.json({ steps, error: 'Body parse failed' })
    }

    const { content, framework_id, control_ref, controlTitle, docType, organization, format = 'docx' } = body

    // Step 3: generate
    try {
      if (format === 'pdf') {
        const mod = await import('../../../lib/pdf-generator')
        const buf = await mod.generatePdf({ content, framework_id, control_ref, controlTitle, docType, organization })
        steps.generate = `OK PDF - ${buf.length} bytes`
        return NextResponse.json({ steps, success: true, bytes: buf.length })
      } else {
        const mod = await import('../../../lib/docx-generator')
        const buf = await mod.generateDocx({ content, framework_id, control_ref, controlTitle, docType, organization })
        steps.generate = `OK DOCX - ${buf.length} bytes`
        // Step 4: base64
        const b64 = buf.toString('base64')
        steps.base64 = `OK - ${b64.length} chars`
        return NextResponse.json({ steps, success: true, bytes: buf.length })
      }
    } catch(e: any) {
      steps.generate = `FAIL: ${e?.message} | ${e?.stack?.slice(0,400)}`
      return NextResponse.json({ steps, error: 'Generate failed' })
    }

  } catch(e: any) {
    steps.uncaught = `${e?.message} | ${e?.stack?.slice(0,300)}`
    return NextResponse.json({ steps, error: 'Uncaught error' })
  }
}
