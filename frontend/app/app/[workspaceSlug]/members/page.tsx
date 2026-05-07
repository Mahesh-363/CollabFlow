'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { workspaceApi } from '@/lib/api'
import { Sidebar } from '@/components/Sidebar'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { formatDistanceToNow } from 'date-fns'

const STATUS_COLOR: Record<string, string> = { online: '#10b981', away: '#f59e0b', dnd: '#ef4444', offline: '#6b7280' }

export default function MembersPage() {
  const params = useParams()
  const slug = params.workspaceSlug as string
  const { isAuthenticated } = useAuthStore()
  const { presenceMap } = useAppStore()
  const [hasHydrated, setHasHydrated] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => { setHasHydrated(true) }, [])

  const enabled = hasHydrated && isAuthenticated

  const { data: workspace } = useQuery({ queryKey: ['workspace', slug], queryFn: () => workspaceApi.get(slug).then(r => r.data.data), enabled })
  const { data: members = [], isLoading } = useQuery({ queryKey: ['workspace-members', slug], queryFn: () => workspaceApi.members(slug).then(r => r.data.data), enabled })

  const filtered = (members as any[]).filter((m: any) =>
    (m.user?.display_name || m.user?.username || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar workspaceSlug={slug} workspaceName={workspace?.name || '...'} workspaceColor={workspace?.icon_color || 'var(--brand)'} />
      <div style={{ flex: 1, overflow: 'hidden auto', padding: '40px 48px' }}>
        <div style={{ maxWidth: 680 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Members</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>{(members as any[]).length} members in {workspace?.name}</p>

          <div style={{ position: 'relative', marginBottom: 24 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
            <input className="input-field" placeholder="Search members..." style={{ paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(4)].map((_, i) => <div key={i} style={{ height: 68, background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border)' }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filtered.map((m: any) => {
                const status = presenceMap[m.user?.id] || 'offline'
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: m.user?.avatar_color || 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
                        {m.user?.initials || m.user?.username?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: STATUS_COLOR[status], border: '2px solid var(--bg-surface)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{m.user?.display_name || m.user?.username}</span>
                        <span style={{ fontSize: 11, color: m.role === 'owner' ? '#f59e0b' : m.role === 'admin' ? 'var(--brand-bright)' : 'var(--text-muted)', fontWeight: 500 }}>{m.role}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{m.user?.username}</div>
                    </div>
                    <div style={{ fontSize: 11, color: STATUS_COLOR[status], fontWeight: 500, textTransform: 'capitalize' }}>{status}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}