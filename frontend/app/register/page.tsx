'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'react-hot-toast'

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore()
  const [form, setForm] = useState({ email: '', username: '', display_name: '', password: '', password_confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    if (form.password !== form.password_confirm) { setErrors({ password_confirm: 'Passwords do not match' }); return }
    try {
      await register(form)
      toast.success('Welcome to CollabFlow!')
      setTimeout(() => { window.location.href = '/app' }, 200)
    } catch (err: any) {
      const data = err?.response?.data?.error?.details || {}
      const fieldErrors: Record<string, string> = {}
      Object.entries(data).forEach(([k, v]: any) => { fieldErrors[k] = Array.isArray(v) ? v[0] : v })
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors)
      else toast.error(err?.response?.data?.error?.message || 'Registration failed')
    }
  }

  const f = (name: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</label>
      <input className="input-field" type={type} placeholder={placeholder} value={form[name]} onChange={e => setForm({ ...form, [name]: e.target.value })} required={name !== 'display_name'} />
      {errors[name] && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{errors[name]}</p>}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 440, zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, background: 'var(--brand)', marginBottom: 12, fontSize: 24 }}>⚡</div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Create Account</h1>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
          <form onSubmit={handleSubmit}>
            {f('display_name', 'Display Name', 'text', 'Your full name')}
            {f('username', 'Username', 'text', 'e.g. mahesh')}
            {f('email', 'Email', 'email', 'you@example.com')}
            {f('password', 'Password', 'password', '••••••••')}
            {f('password_confirm', 'Confirm Password', 'password', '••••••••')}
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 13 }}>
            Already have an account? <Link href="/login" style={{ color: 'var(--brand-bright)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}