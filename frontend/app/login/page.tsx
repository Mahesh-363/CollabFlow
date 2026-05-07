'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'react-hot-toast'

export default function LoginPage() {
  const { login, isLoading } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })

  const redirect = () => {
    setTimeout(() => { window.location.href = '/app/collabflow-demo' }, 200)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(form.email, form.password)
      toast.success('Logged in!')
      redirect()
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || err?.message || 'Login failed')
    }
  }

  const handleDemo = async () => {
    setForm({ email: 'mahesh@collabflow.dev', password: 'demo1234' })
    try {
      await login('mahesh@collabflow.dev', 'demo1234')
      toast.success('Demo login!')
      redirect()
    } catch (err: any) {
      toast.error('Demo login failed')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 16 }}>
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, background: 'var(--brand)', marginBottom: 12, fontSize: 24 }}>⚡</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>CollabFlow</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sign in to your workspace</p>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Email</label>
              <input className="input-field" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
              <input className="input-field" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <button onClick={handleDemo} disabled={isLoading}
            style={{ width: '100%', marginTop: 12, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
            🚀 Fill Demo Credentials
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 13 }}>
            No account? <Link href="/register" style={{ color: 'var(--brand-bright)', textDecoration: 'none', fontWeight: 500 }}>Create one</Link>
          </div>
        </div>

        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
          <strong style={{ color: 'var(--brand-bright)' }}>Demo:</strong> mahesh@collabflow.dev / demo1234
        </div>
      </div>
    </div>
  )
}