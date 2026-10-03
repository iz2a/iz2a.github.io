import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/server'
import { z } from 'zod'

const FindingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  severity: z.enum(['Critical','High','Medium','Low','Informational']),
  framework_id: z.string().optional(),
  domain_ref: z.string().optional(),
  control_ref: z.string().optional(),
  status: z.enum(['Open','In Progress','Resolved','Accepted','Closed']).default('Open'),
  assignee_name: z.string().optional(),
  due_date: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const { client, user } = await createAuthClient(request.headers.get('authorization'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await client.from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 400 })
  const { searchParams } = new URL(request.url)
  let query = client.from('findings').select('*').eq('organization_id', profile.organization_id).order('created_at', { ascending: false })
  const severity = searchParams.get('severity'); const status = searchParams.get('status'); const framework = searchParams.get('framework')
  if (severity) query = query.eq('severity', severity)
  if (status) query = query.eq('status', status)
  if (framework) query = query.eq('framework_id', framework)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const { client, user } = await createAuthClient(request.headers.get('authorization'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await client.from('profiles').select('organization_id, role').eq('id', user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 400 })
  if (!['admin','grc_manager','analyst'].includes(profile.role)) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  const body = await request.json()
  const parsed = FindingSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  const { data, error } = await client.from('findings').insert({ ...parsed.data, organization_id: profile.organization_id, created_by: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await client.from('audit_log').insert({ organization_id: profile.organization_id, user_id: user.id, action: 'CREATE_FINDING', entity_type: 'finding', entity_id: data.id, new_values: data }).catch(() => {})
  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const { client, user } = await createAuthClient(request.headers.get('authorization'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json(); const { id, ...updates } = body
  const { data, error } = await client.from('findings').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest) {
  const { client, user } = await createAuthClient(request.headers.get('authorization'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  const { error } = await client.from('findings').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
