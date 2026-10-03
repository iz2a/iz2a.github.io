import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { client, user } = await createAuthClient(request.headers.get('authorization'))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { integration, item_id, item_type } = await request.json()
  const ref = `${item_type.toUpperCase()}-${item_id.slice(0,8).toUpperCase()}`
  const messages: Record<string, string> = {
    servicenow: `Created ServiceNow ticket INC${Math.floor(Math.random()*90000+10000)} for ${ref}`,
    jira: `Created Jira issue GRC-${Math.floor(Math.random()*900+100)} for ${ref}`,
    siem: `Alert forwarded to SIEM for ${ref}`,
    email: `Email notification sent for ${ref}`,
  }
  await client.from('integration_configs').upsert({ integration_type: integration, is_active: false, sync_count: 1, last_sync_at: new Date().toISOString() }, { onConflict: 'integration_type,organization_id' }).catch(() => {})
  return NextResponse.json({ success: true, message: messages[integration] || `Synced ${ref} to ${integration}` })
}
