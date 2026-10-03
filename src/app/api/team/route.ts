import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createAuthClient, createAdminClient } from '@/lib/supabase/server'

// A strong temporary password: 18 url-safe bytes plus guaranteed character
// classes, so new members do not get a guessable Math.random() secret.
function tempPassword() {
  const core = randomBytes(18).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)
  return core + 'Aa1!'
}

export async function GET(request: NextRequest) {
  const { client, user } = await createAuthClient(request.headers.get('authorization'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await client.from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 400 })
  const { data } = await client.from('profiles').select('id, full_name, email, role, created_at').eq('organization_id', profile.organization_id)
  return NextResponse.json({ data: data || [] })
}

export async function POST(request: NextRequest) {
  const { client, user } = await createAuthClient(request.headers.get('authorization'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: adminProfile } = await client.from('profiles').select('organization_id, role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  const { full_name, email, role } = await request.json()
  const temp_password = tempPassword()
  const adminClient = createAdminClient()
  const { data: newUser, error } = await adminClient.auth.admin.createUser({ email, password: temp_password, email_confirm: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await adminClient.from('profiles').upsert({ id: newUser.user.id, full_name, email, role, organization_id: adminProfile.organization_id })
  return NextResponse.json({ data: { id: newUser.user.id, full_name, email, role }, temp_password }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const { client, user } = await createAuthClient(request.headers.get('authorization'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: adminProfile } = await client.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  const { member_id, role } = await request.json()
  await client.from('profiles').update({ role }).eq('id', member_id)
  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const { client, user } = await createAuthClient(request.headers.get('authorization'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: adminProfile } = await client.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  const member_id = new URL(request.url).searchParams.get('member_id')
  if (!member_id) return NextResponse.json({ error: 'member_id required' }, { status: 400 })
  await client.from('profiles').update({ organization_id: null }).eq('id', member_id)
  return NextResponse.json({ success: true })
}
