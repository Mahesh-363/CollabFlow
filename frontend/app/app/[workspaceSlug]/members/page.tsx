'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi, authApi } from '@/lib/api'
import { Sidebar } from '@/components/Sidebar'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { toast } from 'react-hot-toast'

const STATUS_COLOR: Record<string, string> = { online: '#10b981', away: '#f59e0b', dnd: '#ef4444', offline: '#6b7280' }

export default function MembersPage() {
  const params = useParams()
  const slug = params.workspaceSlug as string
  const { isAuthenticated, user: currentUser } = useAuthStore()
  const { presenceMap } = useAppStore()
  const qc = useQueryClient()
  const [hasHydrated, setHasHydrated] = useState(false)
  const [search, setSearch] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteSearch, setInviteSearch] = useState('')

  useEffect(() => { setHasHydrated(true) }, [])

  const enabled = hasHydrated && isAuthenticated

  const { data: workspace } = useQuery({
    queryKey: ['workspace', slug],
    queryFn: () => workspaceApi.get(slug).then(r => r.data.data),
    enabled
  })

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['workspace-members', slug],
    queryFn: () => workspaceApi.members(slug).then(r => r.data.data),
    enabled
  })

  const { data: searchResults = [] } = useQuery({
    queryKey: ['user-search', inviteSearch],
    queryFn: () => authApi.searchUsers(inviteSearch).then(r => r.data.data || r.data),
    enabled: inviteSearch.length >= 2,
  })

  const addMember = useMutation({
    mutationFn: (userId: string) => workspaceApi.join(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace-members', slug] })
      toast.success('Member added!')
      setShowInvite(false)
      setInviteSearch('')
    },
    onError: () => toast.error('Failed to add member'),
  })

  const memberIds = new Set((members as any[]).map((m: any) => m.id))
  const filtered = (members as any[]).filter((m: any) =>
    (m.display_name || m.username || '').toLowerCase().includes(search.toLowerCase())
  )

  const currentUserRole = (members as any[]).find((m: any) => m.id === currentUser?.id)?.role

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar workspaceSlug={slug} workspaceName={workspace?.name || '...'} workspaceColor={workspace?.icon_color || 'var(--brand)'} />
      <div style={{ flex: 1, overflow: 'hidden auto', padding: '40px 48px' }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Members</h1>
            {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
              <button className="btn-primary" style={{ fontSize: 13, padding: '7px 14px' }} onClick={() => setShowInvite(true)}>
                + Add Member
              </button>
            )}
          </div>
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
                const status = presenceMap[m.id] || 'offline'
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: m.avatar_color || 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
                        {(m.display_name || m.username || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: STATUS_COLOR[status], border: '2px solid var(--bg-surface)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{m.display_name || m.username}</span>
                        <span style={{ fontSize: 11, color: m.role === 'owner' ? '#f59e0b' : m.role === 'admin' ? 'var(--brand-bright)' : 'var(--text-muted)', fontWeight: 500 }}>{m.role}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{m.username}</div>
                    </div>
                    <div style={{ fontSize: 11, color: STATUS_COLOR[status], fontWeight: 500, textTransform: 'capitalize' }}>{status}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440 }}>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', marginBottom: 6 }}>Add Member</h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Share this workspace invite link or search for a user.</p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Invite Link</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input-field" readOnly value={`${window.location.origin}/join/${slug}`} style={{ flex: 1, fontSize: 12 }} />
                <button className="btn-ghost" style={{ flexShrink: 0, fontSize: 13 }} onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join/${slug}`); toast.success('Copied!') }}>
                  Copy
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Search by username</label>
              <input className="input-field" placeholder="e.g. alice" value={inviteSearch} onChange={e => setInviteSearch(e.target.value)} />
              {(searchResults as any[]).length > 0 && (
                <div style={{ marginTop: 8, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  {(searchResults as any[]).map((u: any) => (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg-raised)' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: u.avatar_color || 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>
                        {(u.display_name || u.username)[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{u.display_name || u.username}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                      </div>
                      <button className="btn-primary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => addMember.mutate(u.id)}>
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="btn-ghost" style={{ width: '100%' }} onClick={() => { setShowInvite(false); setInviteSearch('') }}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}