'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { workspaceApi, messageApi } from '@/lib/api'
import { Sidebar } from '@/components/Sidebar'
import { useAuthStore } from '@/store/authStore'
import { formatDistanceToNow } from 'date-fns'

export default function SearchPage() {
  const params = useParams()
  const slug = params.workspaceSlug as string
  const { isAuthenticated } = useAuthStore()
  const [hasHydrated, setHasHydrated] = useState(false)
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  useEffect(() => { setHasHydrated(true) }, [])

  const enabled = hasHydrated && isAuthenticated

  const { data: workspace } = useQuery({ queryKey: ['workspace', slug], queryFn: () => workspaceApi.get(slug).then(r => r.data.data), enabled })

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['search', submitted, slug],
    queryFn: () => messageApi.search(submitted, slug).then(r => r.data.data),
    enabled: enabled && submitted.length >= 2,
  })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar workspaceSlug={slug} workspaceName={workspace?.name || '...'} workspaceColor={workspace?.icon_color || 'var(--brand)'} />
      <div style={{ flex: 1, overflow: 'hidden auto', padding: 40 }}>
        <div style={{ maxWidth: 680 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 20 }}>Search Messages</h1>
          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
              <input className="input-field" placeholder="Search messages..." style={{ paddingLeft: 38 }} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && setSubmitted(query)} />
            </div>
            <button className="btn-primary" onClick={() => setSubmitted(query)} disabled={query.length < 2}>Search</button>
          </div>

          {isFetching && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Searching...</p>}

          {(results as any[]).length > 0 && (
            <div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{(results as any[]).length} results for &quot;{submitted}&quot;</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(results as any[]).map((msg: any) => (
                  <div key={msg.id} onClick={() => window.location.href = `/app/${slug}/${msg.channel}`}
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'all .15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: msg.sender?.avatar_color || 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>
                        {msg.sender?.initials || msg.sender?.username?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{msg.sender?.display_name || msg.sender?.username}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {submitted && (results as any[]).length === 0 && !isFetching && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
              <p>No results for &quot;{submitted}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}