import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { client, user } = await createAuthClient(request.headers.get('authorization'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await client.from('profiles').select('*, organizations(*)').eq('id', user.id).single()
  return NextResponse.json({ data: profile })
}

export async function PATCH(request: NextRequest) {
  const { client, user } = await createAuthClient(request.headers.get('authorization'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { profile: profileUpdates, org: orgUpdates } = await request.json()
  const { data: profile } = await client.from('profiles').update(profileUpdates).eq('id', user.id).select('*, organizations(*)').single()
  if (orgUpdates && profile?.organization_id) {
    await client.from('organizations').update(orgUpdates).eq('id', profile.organization_id)
  }
  return NextResponse.json({ data: profile })
}
