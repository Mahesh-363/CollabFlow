'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { channelApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { toast } from 'react-hot-toast'

interface SidebarProps {
  workspaceSlug: string
  workspaceName: string
  workspaceColor: string
}

export function Sidebar({ workspaceSlug, workspaceName, workspaceColor }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { unreadNotifications, presenceMap } = useAppStore()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [newCh, setNewCh] = useState({ name: '', description: '', channel_type: 'public' })

  const { data: channels = [] } = useQuery({
    queryKey: ['channels', workspaceSlug],
    queryFn: () => channelApi.mine(workspaceSlug).then(r => r.data.data),
    refetchInterval: 30000,
  })

  const createChannel = useMutation({
    mutationFn: (d: any) => channelApi.create(workspaceSlug, d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['channels', workspaceSlug] })
      toast.success(`#${res.data.data.name} created!`)
      setShowCreate(false)
      setNewCh({ name: '', description: '', channel_type: 'public' })
      window.location.href = `/app/${workspaceSlug}/${res.data.data.id}`
    },
    onError: () => toast.error('Failed to create channel'),
  })

  const myStatus = presenceMap[user?.id || ''] || 'online'
  const statusColor: Record<string, string> = {
    online: '#10b981',
    away: '#f59e0b',
    dnd: '#ef4444',
    offline: '#6b7280'
  }

  return (
    <aside style={{
      width: 260, minWidth: 260, height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
    }}>
      {/* Header */}
      <div
        style={{
          padding: '13px 14px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer'
        }}
        onClick={() => window.location.href = '/app'}
      >
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: workspaceColor || 'var(--brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 13, color: 'white', flexShrink: 0
        }}>
          {workspaceName?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: 13, color: 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {workspaceName}
          </div>
          <div style={{ fontSize: 10, color: statusColor[myStatus], display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor[myStatus] }} />
            {myStatus}
          </div>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>&#9660;</span>
      </div>

      {/* Nav */}
      <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
        {[
          { href: `/app/${workspaceSlug}/search`, icon: '🔍', label: 'Search' },
          { href: `/app/${workspaceSlug}/notifications`, icon: '🔔', label: 'Notifications', badge: unreadNotifications > 0 ? unreadNotifications : undefined },
          { href: `/app/${workspaceSlug}/members`, icon: '👥', label: 'Members' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-item ${pathname === item.href ? 'active' : ''}`}
            style={{ marginBottom: 2 }}
          >
            <span style={{ fontSize: 13 }}>{item.icon}</span>
            {item.label}
            {item.badge && item.badge > 0 && (
              <span style={{
                marginLeft: 'auto', background: 'var(--brand)', color: 'white',
                borderRadius: 99, fontSize: 10, padding: '1px 5px', fontWeight: 700
              }}>
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Channels */}
      <div style={{ flex: 1, overflow: 'hidden auto', padding: '8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px 4px'
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '.06em'
          }}>
            Channels
          </span>
          <button
            onClick={() => setShowCreate(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1 }}
          >
            +
          </button>
        </div>
        {(channels as any[]).map((ch: any) => {
          const isActive = pathname.includes(ch.id)
          return (
            <Link
              key={ch.id}
              href={`/app/${workspaceSlug}/${ch.id}`}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              style={{ justifyContent: 'space-between', fontSize: 13 }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                <span style={{ fontSize: 12, color: isActive ? 'var(--brand-bright)' : 'var(--text-muted)' }}>
                  {ch.channel_type === 'private' ? '🔒' : '#'}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ch.name}
                </span>
              </span>
              {ch.unread_count > 0 && !isActive && (
                <span style={{
                  background: 'var(--brand)', color: 'white',
                  borderRadius: 99, fontSize: 10, padding: '1px 5px',
                  fontWeight: 700, flexShrink: 0
                }}>
                  {ch.unread_count}
                </span>
              )}
            </Link>
          )
        })}
        {(channels as any[]).length === 0 && (
          <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No channels yet
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '8px 10px', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: user?.avatar_color || 'var(--brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'white'
          }}>
            {user?.initials}
          </div>
          <div style={{
            position: 'absolute', bottom: -1, right: -1,
            width: 9, height: 9, borderRadius: '50%',
            background: statusColor[myStatus],
            border: '1.5px solid var(--bg-surface)'
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {user?.display_name || user?.username}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>@{user?.username}</div>
        </div>
        <Link href={`/app/${workspaceSlug}/settings`} style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none' }}>
          ⚙️
        </Link>
        <button
          onClick={async () => { await logout(); window.location.href = '/login' }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14 }}
        >
          🚪
        </button>
      </div>

      {/* Create channel modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 28, width: '100%', maxWidth: 400
          }}>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', marginBottom: 20 }}>
              Create a channel
            </h2>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Name
              </label>
              <input
                className="input-field"
                placeholder="e.g. announcements"
                value={newCh.name}
                onChange={e => setNewCh({ ...newCh, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Description
              </label>
              <input
                className="input-field"
                placeholder="What is this channel about?"
                value={newCh.description}
                onChange={e => setNewCh({ ...newCh, description: e.target.value })}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Type
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['public', 'private'].map(t => (
                  <button
                    key={t}
                    onClick={() => setNewCh({ ...newCh, channel_type: t })}
                    style={{
                      flex: 1, padding: '8px', borderRadius: 8,
                      border: `1px solid ${newCh.channel_type === t ? 'var(--brand)' : 'var(--border)'}`,
                      background: newCh.channel_type === t ? 'rgba(99,102,241,0.1)' : 'transparent',
                      color: newCh.channel_type === t ? 'var(--brand-bright)' : 'var(--text-muted)',
                      cursor: 'pointer', fontSize: 13, fontWeight: 500
                    }}
                  >
                    {t === 'public' ? '# Public' : '🔒 Private'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ flex: 2 }}
                disabled={!newCh.name.trim() || createChannel.isPending}
                onClick={() => createChannel.mutate(newCh)}
              >
                {createChannel.isPending ? 'Creating...' : 'Create Channel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}