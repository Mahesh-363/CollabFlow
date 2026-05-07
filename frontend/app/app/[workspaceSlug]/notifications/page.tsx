'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi, notificationApi } from '@/lib/api'
import { Sidebar } from '@/components/Sidebar'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-hot-toast'

export default function NotificationsPage() {
  const params = useParams()
  const slug = params.workspaceSlug as string
  const qc = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const { setUnreadNotifications } = useAppStore()
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => { setHasHydrated(true) }, [])

  const enabled = hasHydrated && isAuthenticated

  const { data: workspace } = useQuery({ queryKey: ['workspace', slug], queryFn: () => workspaceApi.get(slug).then(r => r.data.data), enabled })
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationApi.list().then(r => r.data), refetchInterval: 30000, enabled })

  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); setUnreadNotifications(0); toast.success('All marked as read') },
  })

  const notifications = data?.data || []
  const unread = data?.unread_count || 0

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar workspaceSlug={slug} workspaceName={workspace?.name || '...'} workspaceColor={workspace?.icon_color || 'var(--brand)'} />
      <div style={{ flex: 1, overflow: 'hidden auto', padding: '40px 48px' }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Notifications</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{unread > 0 ? `${unread} unread` : 'All caught up!'}</p>
            </div>
            {unread > 0 && <button className="btn-ghost" onClick={() => markAll.mutate()} style={{ fontSize: 13 }}>✓ Mark all read</button>}
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...Array(4)].map((_, i) => <div key={i} style={{ height: 72, background: 'var(--bg-surface)', borderRadius: 10, border: '1px solid var(--border)' }} />)}
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>No notifications yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {notifications.map((n: any) => (
                <div key={n.id} onClick={() => { if (n.channel_id) window.location.href = `/app/${slug}/${n.channel_id}` }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: n.is_read ? 'var(--bg-surface)' : 'rgba(99,102,241,0.06)', border: `1px solid ${n.is_read ? 'var(--border)' : 'rgba(99,102,241,0.2)'}`, borderRadius: 10, cursor: n.channel_id ? 'pointer' : 'default' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: n.is_read ? 'var(--bg-overlay)' : 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {n.notification_type === 'mention' ? '@' : n.notification_type === 'reply' ? '💬' : '🔔'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                      <p style={{ fontSize: 14, fontWeight: n.is_read ? 400 : 600, color: 'var(--text-primary)' }}>{n.title}</p>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                    </div>
                    {n.body && <p style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</p>}
                  </div>
                  {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0, marginTop: 4 }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}