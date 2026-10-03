import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_MODE } from '@/lib/public-mode'

export default async function RootPage() {
  // In public mode everyone lands on the dashboard; guests get the demo
  // workspace, signed-in users get their own data.
  if (PUBLIC_MODE) redirect('/dashboard')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')
  redirect('/login')
}
