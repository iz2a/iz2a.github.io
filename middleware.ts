import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // When public mode is on, nobody is forced to sign in: the dashboard runs
  // against a local demo workspace for guests. Signed-in users still get their
  // real data because the dashboard detects the session.
  const publicMode = (process.env.NEXT_PUBLIC_PUBLIC_MODE ?? 'true').toLowerCase() !== 'false'

  // API routes - just refresh session cookies, never redirect
  if (path.startsWith('/api/')) {
    return supabaseResponse
  }

  // Auth routes
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
  if (authRoutes.includes(path)) {
    if (user) return NextResponse.redirect(new URL('/dashboard', request.url))
    return supabaseResponse
  }

  // Protected routes: only redirect to login when public mode is off
  if (!user && !publicMode) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
