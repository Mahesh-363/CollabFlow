'use client'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import { messageApi } from '@/lib/api'
import { useAppStore } from '@/store/appStore'
import { toast } from 'react-hot-toast'

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '✅', '🚀']

function Avatar({ user }: { user: any }) {
  return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: user?.avatar_color || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0, marginTop: 1 }}>
      {user?.initials || user?.username?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function renderContent(content: string) {
  const html = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/@(\w+)/g, '<span class="mention">@$1</span>')
  return <span className="message-content" dangerouslySetInnerHTML={{ __html: html }} />
}

export function MessageItem({ message, onThreadOpen, isThread = false }: { message: any; onThreadOpen?: (msg: any) => void; isThread?: boolean }) {
  const { user } = useAuthStore()
  const { updateMessage, deleteMessage } = useAppStore()
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const [showEmojis, setShowEmojis] = useState(false)
  const isOwn = message.sender?.id === user?.id
  const time = new Date(message.created_at)

  const handleEdit = async () => {
    if (!editContent.trim()) return
    try {
      const { data } = await messageApi.edit(message.id, editContent)
      updateMessage(message.channel, data.data)
      setEditing(false)
    } catch { toast.error('Failed to edit') }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this message?')) return
    try {
      await messageApi.delete(message.id)
      deleteMessage(message.channel, message.id)
    } catch { toast.error('Failed to delete') }
  }

  const handleReact = async (emoji: string) => {
    const existing = message.reactions_summary?.find((r: any) => r.emoji === emoji && r.reacted_by_me)
    try {
      if (existing) await messageApi.unreact(message.id, emoji)
      else await messageApi.react(message.id, emoji)
      setShowEmojis(false)
    } catch {}
  }

  if (message.is_deleted) {
    return (
      <div style={{ padding: '4px 16px', display: 'flex', alignItems: 'center', gap: 10, opacity: 0.5 }}>
        <div style={{ width: 34, height: 34 }} />
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>This message was deleted.</span>
      </div>
    )
  }

  return (
    <div className="animate-fade-in"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowEmojis(false) }}
      style={{ padding: '4px 16px', display: 'flex', gap: 10, alignItems: 'flex-start', position: 'relative', borderRadius: 6, background: hovered ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background .1s' }}>
      <Avatar user={message.sender} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
          <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>{message.sender?.display_name || message.sender?.username}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatDistanceToNow(time, { addSuffix: true })}</span>
          {message.is_edited && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>(edited)</span>}
        </div>

        {editing ? (
          <div>
            <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit() } if (e.key === 'Escape') setEditing(false) }}
              style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-raised)', border: '1px solid var(--brand)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, resize: 'none', minHeight: 60, outline: 'none' }}
              autoFocus />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button className="btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={handleEdit}>Save</button>
              <button className="btn-ghost" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.6, wordBreak: 'break-word' }}>
            {renderContent(message.content)}
          </div>
        )}

        {message.attachments?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {message.attachments.map((a: any) => (
              <div key={a.id}>
                {a.file_type?.startsWith('image/') ? (
                  <img src={a.file_url} alt={a.file_name} style={{ maxWidth: 300, maxHeight: 200, borderRadius: 8, border: '1px solid var(--border)', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(a.file_url, '_blank')} />
                ) : (
                  <a href={a.file_url} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', color: 'var(--text-primary)', fontSize: 13 }}>
                    📎 {a.file_name}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {message.reactions_summary?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {message.reactions_summary.map((r: any) => (
              <button key={r.emoji} onClick={() => handleReact(r.emoji)}
                style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 99, border: `1px solid ${r.reacted_by_me ? 'var(--brand)' : 'var(--border)'}`, background: r.reacted_by_me ? 'rgba(99,102,241,0.15)' : 'var(--bg-raised)', cursor: 'pointer', fontSize: 13 }}>
                {r.emoji} <span style={{ fontSize: 11, color: r.reacted_by_me ? 'var(--brand-bright)' : 'var(--text-secondary)', fontWeight: 500 }}>{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {!isThread && message.reply_count > 0 && (
          <button onClick={() => onThreadOpen?.(message)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, padding: '2px 7px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--brand-bright)', fontSize: 11, fontWeight: 500 }}>
            💬 {message.reply_count} {message.reply_count === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {hovered && !editing && (
        <div className="animate-fade-in" style={{ position: 'absolute', top: -2, right: 16, display: 'flex', alignItems: 'center', gap: 2, background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 8, padding: '3px 4px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 10 }}>
          <div style={{ position: 'relative' }}>
            <button className="btn-ghost" style={{ padding: '4px 6px', fontSize: 12 }} onClick={() => setShowEmojis(!showEmojis)}>😊</button>
            {showEmojis && (
              <div style={{ position: 'absolute', bottom: '100%', right: 0, background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 10, padding: 8, display: 'flex', gap: 4, zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', flexWrap: 'wrap', width: 164, marginBottom: 4 }}>
                {QUICK_EMOJIS.map(e => (
                  <button key={e} onClick={() => handleReact(e)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 4, borderRadius: 6 }}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          {!isThread && <button className="btn-ghost" style={{ padding: '4px 6px', fontSize: 12 }} onClick={() => onThreadOpen?.(message)}>💬</button>}
          {isOwn && (
            <>
              <button className="btn-ghost" style={{ padding: '4px 6px', fontSize: 12 }} onClick={() => { setEditContent(message.content); setEditing(true) }}>✏️</button>
              <button className="btn-ghost" style={{ padding: '4px 6px', fontSize: 12, color: 'var(--danger)' }} onClick={handleDelete}>🗑️</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}