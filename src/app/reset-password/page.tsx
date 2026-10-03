'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Method 1: listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true)
      }
    })

    // Method 2: if hash contains access_token, exchange it manually
    const hash = window.location.hash
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          .then(({ error }) => { if (!error) setReady(true) })
      }
    }

    // Method 3: check if already has valid session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) { setError(err.message); setLoading(false); return }
      await supabase.auth.signOut()
      router.push('/login')
    } catch (e: any) {
      setError(e?.message || 'Failed to update password')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '12px 14px',
    borderRadius: '8px', border: '1px solid #1A2340', background: '#080C18',
    color: '#F0F4FF', fontSize: '14px', outline: 'none',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: '#050810', fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            {/* Tower icon */}
            <div style={{ position: 'relative', width: '56px', height: '56px' }}>
              <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '56px', height: '56px' }}>
                <rect width="56" height="56" rx="14" fill="#0C1128" stroke="#2563EB" strokeWidth="1.5"/>
                {/* Watchtower / radar icon */}
                <circle cx="28" cy="28" r="10" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3 2"/>
                <circle cx="28" cy="28" r="5" stroke="#38BDF8" strokeWidth="1.5"/>
                <circle cx="28" cy="28" r="2" fill="#38BDF8"/>
                <line x1="28" y1="8" x2="28" y2="18" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="28" y1="38" x2="28" y2="48" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8" y1="28" x2="18" y2="28" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="38" y1="28" x2="48" y2="28" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                {/* Sweep line */}
                <line x1="28" y1="28" x2="38" y2="18" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'white', letterSpacing: '-0.3px', lineHeight: 1 }}>MIRSAD</div>
              <div style={{ fontSize: '12px', color: '#60A5FA', marginTop: '3px', letterSpacing: '0.3px' }}>مِرصاد · The Watchtower</div>
            </div>
          </div>
        </div>

        <div style={{ background: '#0C1128', border: '1px solid #1A2340', borderRadius: '16px', padding: '36px' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: 'white' }}>Set new password</h1>
          <p style={{ margin: '0 0 28px', fontSize: '14px', color: '#94A3B8' }}>Choose a strong password for your account</p>

          {!ready && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', color: '#94A3B8', background: '#080C18', border: '1px solid #1A2340', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '16px', height: '16px', border: '2px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              <span>Verifying reset link…</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {ready && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', color: '#6EE7B7', background: '#0A2A1A', border: '1px solid #064E3B' }}>
              ✓ Identity verified - set your new password below
            </div>
          )}

          {error && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', color: '#FCA5A5', background: '#1a0a0a', border: '1px solid #450a0a' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94A3B8', marginBottom: '6px' }}>New Password</label>
              <input type="password" required placeholder="Minimum 8 characters" value={password}
                onChange={e => setPassword(e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#1A2340'} />
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94A3B8', marginBottom: '6px' }}>Confirm Password</label>
              <input type="password" required placeholder="Repeat new password" value={confirm}
                onChange={e => setConfirm(e.target.value)} style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#1A2340'} />
            </div>
            <button type="submit" disabled={loading || !ready}
              style={{ width: '100%', padding: '13px', borderRadius: '8px', border: 'none', background: ready ? '#2563EB' : '#1A2340', color: 'white', fontSize: '15px', fontWeight: 600, cursor: loading || !ready ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'background 0.2s' }}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
