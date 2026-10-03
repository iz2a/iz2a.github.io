import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Shared options - disable everything that uses browser locks/broadcast
const SERVER_OPTIONS = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    flowType: 'implicit' as const,
  },
  realtime: { params: { eventsPerSecond: 0 } },
  global: {
    headers: { 'X-Client-Info': 'mirsad-server' },
  },
}

export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    SERVER_OPTIONS
  )
}

export async function createAuthClient(authHeader: string | null) {
  const admin = createAdminClient()
  if (!authHeader?.startsWith('Bearer ')) return { client: admin, user: null }
  const token = authHeader.replace('Bearer ', '')
  try {
    const { data: { user }, error } = await admin.auth.getUser(token)
    if (error || !user) return { client: admin, user: null }
    return { client: admin, user }
  } catch {
    return { client: admin, user: null }
  }
}

export function createClient() {
  return createAdminClient()
}
