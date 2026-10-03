// app/api/auth/route.ts - Registration with org creation
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const RegisterSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  organization_name: z.string().min(2),
  organization_sector: z.string().default('financial'),
  role: z.enum(['admin','grc_manager','analyst','viewer']).default('admin'),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action } = body

  if (action === 'register') {
    const parsed = RegisterSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })

    const admin = createAdminClient()
    const { full_name, email, password, organization_name, organization_sector, role } = parsed.data

    // Create org first
    const { data: org, error: orgErr } = await admin
      .from('organizations')
      .insert({ name: organization_name, sector: organization_sector })
      .select()
      .single()

    if (orgErr) return NextResponse.json({ error: orgErr.message }, { status: 500 })

    // Create auth user
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authErr) {
      await admin.from('organizations').delete().eq('id', org.id)
      return NextResponse.json({ error: authErr.message }, { status: 500 })
    }

    // Create profile
    const { error: profileErr } = await admin.from('profiles').insert({
      id: authData.user.id,
      full_name,
      email,
      role,
      organization_id: org.id,
    })

    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

    return NextResponse.json({ success: true, organization_id: org.id })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
