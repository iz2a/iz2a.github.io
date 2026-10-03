'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ── Shared radar logo - same SVG used in dashboard sidebar ───────────────────
export function MirsadLogo({ size = 44 }: { size?: number }) {
  const r = size / 2
  const cx = r, cy = r
  return (
    <svg viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size, flexShrink: 0 }}>
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r * 0.82} stroke="#495057" strokeWidth="1" strokeDasharray="3 2"/>
      {/* Mid ring */}
      <circle cx={cx} cy={cy} r={r * 0.52} stroke="#6c757d" strokeWidth="1"/>
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={r * 0.24} stroke="#adb5bd" strokeWidth="1"/>
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={r * 0.09} fill="#f8f9fa"/>
      {/* Crosshairs */}
      <line x1={cx} y1={cy - r * 0.82} x2={cx} y2={cy - r * 0.52} stroke="#495057" strokeWidth="1" strokeLinecap="round"/>
      <line x1={cx} y1={cy + r * 0.52} x2={cx} y2={cy + r * 0.82} stroke="#495057" strokeWidth="1" strokeLinecap="round"/>
      <line x1={cx - r * 0.82} y1={cy} x2={cx - r * 0.52} y2={cy} stroke="#495057" strokeWidth="1" strokeLinecap="round"/>
      <line x1={cx + r * 0.52} y1={cy} x2={cx + r * 0.82} y2={cy} stroke="#495057" strokeWidth="1" strokeLinecap="round"/>
      {/* Sweep line */}
      <line x1={cx} y1={cy} x2={cx + r * 0.68} y2={cy - r * 0.68} stroke="#adb5bd" strokeWidth="1.2" strokeLinecap="round" opacity="0.9"/>
      {/* Blip on sweep */}
      <circle cx={cx + r * 0.52} cy={cy - r * 0.52} r={r * 0.07} fill="#f8f9fa" opacity="0.8"/>
    </svg>
  )
}

function LogoBlock() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 36 }}>
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <MirsadLogo size={52} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f8f9fa', letterSpacing: '0.12em', lineHeight: 1 }}>
            MIRSAD
          </div>
          <div style={{ fontSize: 11, color: '#6c757d', marginTop: 4, letterSpacing: '0.04em' }}>
            مِرصاد · Cybersecurity GRC
          </div>
        </div>
      </div>
    </div>
  )
}

const INP: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 13px',
  borderRadius: 6,
  border: '1px solid #3d4247',
  background: '#212529',
  color: '#f8f9fa',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}

const LABEL: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: '#6c757d', marginBottom: 5,
  textTransform: 'uppercase', letterSpacing: '0.07em',
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      })
      if (err) { setError(err.message); setLoading(false); return }
      router.push('/dashboard')
    } catch (e: any) {
      setError(e?.message || 'Failed to sign in')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, background: '#1a1d20',
      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <LogoBlock />

        <div style={{
          background: '#212529',
          border: '1px solid #2d3136',
          borderRadius: 10,
          padding: '32px 28px',
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#f8f9fa', marginBottom: 4 }}>
              Sign in
            </div>
            <div style={{ fontSize: 12, color: '#6c757d' }}>
              Access your GRC workspace
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 13px', borderRadius: 6,
              fontSize: 12, color: '#f1aeb5',
              background: '#2a1a1c', border: '1px solid #dc354533',
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={LABEL}>Email</label>
              <input type="email" required autoFocus
                placeholder="you@organization.com.sa"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={INP}
                onFocus={e => e.target.style.borderColor = '#adb5bd'}
                onBlur={e => e.target.style.borderColor = '#3d4247'}
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <label style={LABEL}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 11, color: '#6c757d', textDecoration: 'none' }}>
                  Forgot?
                </Link>
              </div>
              <input type="password" required
                placeholder="Your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={INP}
                onFocus={e => e.target.style.borderColor = '#adb5bd'}
                onBlur={e => e.target.style.borderColor = '#3d4247'}
              />
            </div>

            <div style={{ height: 20 }} />

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '10px',
              borderRadius: 6, border: '1px solid #495057',
              background: loading ? '#2d3136' : '#343a40',
              color: loading ? '#6c757d' : '#f8f9fa',
              fontSize: 13, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              letterSpacing: '0.03em',
              transition: 'background 0.15s, border-color 0.15s',
            }}
              onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#495057' }}
              onMouseLeave={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#343a40' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #2d3136', textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: '#6c757d' }}>No account? </span>
            <Link href="/register" style={{ fontSize: 12, color: '#adb5bd', textDecoration: 'none', fontWeight: 600 }}>
              Create one
            </Link>
            <div style={{ marginTop: 12 }}>
              <Link href="/dashboard" style={{ fontSize: 12, color: '#6c757d', textDecoration: 'none' }}>
                Explore the demo without signing in →
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative footer */}
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {['NCA ECC', 'NCA DCC', 'SAMA CSF', 'ISO 27001', 'NIST CSF'].map(fw => (
              <span key={fw} style={{ fontSize: 9, color: '#3d4247', fontWeight: 600, letterSpacing: '0.06em' }}>{fw}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
