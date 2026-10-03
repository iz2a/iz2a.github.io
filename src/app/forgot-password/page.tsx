'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MirsadLogo } from '../login/page'

function LogoBlock() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <MirsadLogo size={52} />
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f8f9fa', letterSpacing: '0.12em', lineHeight: 1 }}>MIRSAD</div>
          <div style={{ fontSize: 11, color: '#6c757d', marginTop: 4, letterSpacing: '0.04em' }}>مِرصاد · Cybersecurity GRC</div>
        </div>
      </div>
    </div>
  )
}

const INP: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '10px 13px',
  borderRadius: 6, border: '1px solid #3d4247', background: '#212529',
  color: '#f8f9fa', fontSize: 13, outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Please enter your email address')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (err) { setError(err.message); setLoading(false); return }
      setSent(true)
    } catch (e: any) {
      setError(e?.message || 'Failed to send reset email')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, background: '#1a1d20',
      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <LogoBlock />
        <div style={{ background: '#212529', border: '1px solid #2d3136', borderRadius: 10, padding: '32px 28px' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2d3136', border: '1px solid #3d4247', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 18 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f8f9fa', marginBottom: 6 }}>Check your email</div>
              <div style={{ fontSize: 12, color: '#6c757d', marginBottom: 4 }}>Reset link sent to</div>
              <div style={{ fontSize: 13, color: '#adb5bd', fontWeight: 600, marginBottom: 16 }}>{email}</div>
              <div style={{ fontSize: 11, color: '#495057', marginBottom: 20 }}>Check your spam folder if you don't see it.</div>
              <button onClick={() => { setSent(false); setEmail('') }}
                style={{ background: 'none', border: 'none', color: '#6c757d', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                Try a different email →
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#f8f9fa', marginBottom: 4 }}>Reset password</div>
                <div style={{ fontSize: 12, color: '#6c757d' }}>We'll send a reset link to your email</div>
              </div>
              {error && (
                <div style={{ marginBottom: 16, padding: '10px 13px', borderRadius: 6, fontSize: 12, color: '#f1aeb5', background: '#2a1a1c', border: '1px solid #dc354533' }}>{error}</div>
              )}
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6c757d', marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Email</label>
                  <input type="email" required autoFocus placeholder="you@organization.com.sa"
                    value={email} onChange={e => setEmail(e.target.value)} style={INP}
                    onFocus={e => e.target.style.borderColor = '#adb5bd'}
                    onBlur={e => e.target.style.borderColor = '#3d4247'} />
                </div>
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #495057',
                  background: loading ? '#2d3136' : '#343a40', color: loading ? '#6c757d' : '#f8f9fa',
                  fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #2d3136', textAlign: 'center' }}>
            <Link href="/login" style={{ fontSize: 12, color: '#6c757d', textDecoration: 'none' }}>← Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
