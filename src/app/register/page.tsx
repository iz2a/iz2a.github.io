'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { MirsadLogo } from '../login/page'

function LogoBlock() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
  padding: '10px 13px', borderRadius: 6,
  border: '1px solid #3d4247', background: '#212529',
  color: '#f8f9fa', fontSize: 13, outline: 'none',
  fontFamily: 'inherit', transition: 'border-color 0.15s',
}

const LABEL: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: '#6c757d', marginBottom: 5,
  textTransform: 'uppercase', letterSpacing: '0.07em',
}

const FIELD = { marginBottom: 14 }

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm: '', org_name: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const u = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const focus = (e: any) => e.target.style.borderColor = '#adb5bd'
  const blur  = (e: any) => e.target.style.borderColor = '#3d4247'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.full_name.trim()) return setError('Full name is required')
    if (!form.email.trim()) return setError('Email is required')
    if (form.password.length < 8) return setError('Password must be at least 8 characters')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (!form.org_name.trim()) return setError('Organization name is required')
    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { full_name: form.full_name } }
      })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }
      if (!data.user) { setError('Registration failed. Please try again.'); setLoading(false); return }

      const { data: org, error: orgErr } = await supabase
        .from('organizations').insert({ name: form.org_name.trim() }).select().single()
      if (orgErr) { setError('Could not create organization: ' + orgErr.message); setLoading(false); return }

      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        organization_id: (org as any).id,
        role: 'admin',
      })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px', background: '#1a1d20',
      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <LogoBlock />

        <div style={{
          background: '#212529', border: '1px solid #2d3136',
          borderRadius: 10, padding: '32px 28px',
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#f8f9fa', marginBottom: 4 }}>
              Create account
            </div>
            <div style={{ fontSize: 12, color: '#6c757d' }}>
              Set up your GRC workspace
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
            <div style={FIELD}>
              <label style={LABEL}>Full Name</label>
              <input type="text" required autoFocus placeholder="Abdullah Al-Rashid"
                value={form.full_name} onChange={e => u('full_name', e.target.value)}
                style={INP} onFocus={focus} onBlur={blur} />
            </div>

            <div style={FIELD}>
              <label style={LABEL}>Email</label>
              <input type="email" required placeholder="you@organization.com.sa"
                value={form.email} onChange={e => u('email', e.target.value)}
                style={INP} onFocus={focus} onBlur={blur} />
            </div>

            <div style={FIELD}>
              <label style={LABEL}>Organization</label>
              <input type="text" required placeholder="e.g. Saudi National Bank"
                value={form.org_name} onChange={e => u('org_name', e.target.value)}
                style={INP} onFocus={focus} onBlur={blur} />
            </div>

            {/* Two-col password row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px', marginBottom: 14 }}>
              <div>
                <label style={LABEL}>Password</label>
                <input type="password" required placeholder="Min 8 chars"
                  value={form.password} onChange={e => u('password', e.target.value)}
                  style={INP} onFocus={focus} onBlur={blur} />
              </div>
              <div>
                <label style={LABEL}>Confirm</label>
                <input type="password" required placeholder="Repeat"
                  value={form.confirm} onChange={e => u('confirm', e.target.value)}
                  style={INP} onFocus={focus} onBlur={blur} />
              </div>
            </div>

            <div style={{ height: 8 }} />

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '10px',
              borderRadius: 6, border: '1px solid #495057',
              background: loading ? '#2d3136' : '#343a40',
              color: loading ? '#6c757d' : '#f8f9fa',
              fontSize: 13, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.03em',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#495057' }}
              onMouseLeave={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#343a40' }}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #2d3136', textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: '#6c757d' }}>Already have an account? </span>
            <Link href="/login" style={{ fontSize: 12, color: '#adb5bd', textDecoration: 'none', fontWeight: 600 }}>
              Sign in
            </Link>
          </div>
        </div>

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
