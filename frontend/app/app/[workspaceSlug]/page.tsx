'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { workspaceApi, channelApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Sidebar } from '@/components/Sidebar'

export default function WorkspacePage() {
  const params = useParams()
  const slug = params.workspaceSlug as string
  const { isAuthenticated } = useAuthStore()
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => { setHasHydrated(true) }, [])

  const { data: workspace } = useQuery({
    queryKey: ['workspace', slug],
    queryFn: () => workspaceApi.get(slug).then(r => r.data.data),
    enabled: hasHydrated && isAuthenticated && !!slug,
  })

  const { data: channels = [] } = useQuery({
    queryKey: ['channels-all', slug],
    queryFn: () => channelApi.list(slug, 'public').then(r => r.data.data),
    enabled: hasHydrated && isAuthenticated && !!slug,
  })

  const { data: myChannels = [] } = useQuery({
    queryKey: ['channels', slug],
    queryFn: () => channelApi.mine(slug).then(r => r.data.data),
    enabled: hasHydrated && isAuthenticated && !!slug,
  })

  const myChannelIds = new Set((myChannels as any[]).map((c: any) => c.id))

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar workspaceSlug={slug} workspaceName={workspace?.name || '...'} workspaceColor={workspace?.icon_color || 'var(--brand)'} />
      <div style={{ flex: 1, overflow: 'hidden auto', padding: '48px' }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: workspace?.icon_color || 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white' }}>
              {workspace?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>{workspace?.name}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{workspace?.description || 'Welcome!'} · {workspace?.member_count} members</p>
            </div>
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>All Channels</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(channels as any[]).map((ch: any) => (
              <div key={ch.id} onClick={() => window.location.href = `/app/${slug}/${ch.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-bright)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 16 }}>
                  {ch.channel_type === 'private' ? '🔒' : '#'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 1 }}>#{ch.name}</div>
                  {ch.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.description}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ch.member_count} members</span>
                  <span style={{ fontSize: 11, color: myChannelIds.has(ch.id) ? 'var(--success)' : 'var(--brand-bright)', fontWeight: 600 }}>{myChannelIds.has(ch.id) ? 'Joined' : 'Join'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}