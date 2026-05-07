'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { toast } from 'react-hot-toast'

export default function AppHome() {
  const { user, logout, isAuthenticated } = useAuthStore()
  const { setActiveWorkspace } = useAppStore()
  const qc = useQueryClient()
  const [hasHydrated, setHasHydrated] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newWs, setNewWs] = useState({ name: '', description: '', icon_color: '#6366f1' })

  useEffect(() => { setHasHydrated(true) }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspaceApi.list().then(r => r.data.data),
    enabled: hasHydrated && isAuthenticated,
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => workspaceApi.create(d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['workspaces'] })
      toast.success('Workspace created!')
      setShowCreate(false)
      const ws = res.data.data
      setActiveWorkspace(ws)
      window.location.href = `/app/${ws.slug}`
    },
    onError: () => toast.error('Failed to create workspace'),
  })

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 56, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>CollabFlow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: user?.avatar_color || 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>
            {user?.initials || user?.username?.[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user?.display_name || user?.username}</span>
          <button className="btn-ghost" onClick={async () => { await logout(); window.location.href = '/login' }} style={{ fontSize: 13 }}>Sign out</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ width: '100%', maxWidth: 720 }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Welcome back, {user?.display_name?.split(' ')[0] || user?.username} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 36, fontSize: 15 }}>Select a workspace to get started.</p>

          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
              {[1, 2, 3].map(i => <div key={i} style={{ height: 110, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)' }} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
              {(data || []).map((ws: any) => (
                <button key={ws.id} onClick={() => { setActiveWorkspace(ws); window.location.href = `/app/${ws.slug}` }}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, textAlign: 'left', cursor: 'pointer', transition: 'all .15s', display: 'flex', flexDirection: 'column', gap: 12 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: ws.icon_color || 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white' }}>
                    {ws.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', marginBottom: 2 }}>{ws.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ws.member_count} members · {ws.current_user_role}</div>
                  </div>
                </button>
              ))}

              <button onClick={() => setShowCreate(true)}
                style={{ background: 'transparent', border: '1px dashed var(--border-bright)', borderRadius: 12, padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 110 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand)'; (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.05)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-bright)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--brand-bright)' }}>+</div>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--brand-bright)' }}>New Workspace</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 440 }}>
            <h2 style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 20 }}>Create Workspace</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Name</label>
              <input className="input-field" placeholder="e.g. Acme Inc" value={newWs.name} onChange={e => setNewWs({ ...newWs, name: e.target.value })} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Description</label>
              <input className="input-field" placeholder="What is this workspace for?" value={newWs.description} onChange={e => setNewWs({ ...newWs, description: e.target.value })} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Color</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setNewWs({ ...newWs, icon_color: c })}
                    style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: newWs.icon_color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 2 }} disabled={!newWs.name.trim() || createMutation.isPending} onClick={() => createMutation.mutate(newWs)}>
                {createMutation.isPending ? 'Creating...' : 'Create Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}