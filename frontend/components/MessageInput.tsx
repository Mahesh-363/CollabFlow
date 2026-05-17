'use client'
import { useState, useRef, useEffect } from 'react'
import { fileApi } from '@/lib/api'
import { useAppStore } from '@/store/appStore'
import { toast } from 'react-hot-toast'

const EMOJIS = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '🚀', '✅', '👀', '💯', '😎', '🙏']

interface Props {
  channelId: string
  channelName: string
  onSend: (content: string) => void
  onTypingStart: () => void
  onTypingStop: () => void
  replyTo?: any
  onClearReply?: () => void
}

export function MessageInput({ channelId, channelName, onSend, onTypingStart, onTypingStop, replyTo, onClearReply }: Props) {
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const typingTimer = useRef<any>(null)
  const isTyping = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { typingUsers } = useAppStore()
  const typing = typingUsers[channelId] || []

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const ta = textareaRef.current
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 160) + 'px' }
    if (!isTyping.current) { isTyping.current = true; onTypingStart() }
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => { isTyping.current = false; onTypingStop() }, 1500)
  }

  const handleSend = () => {
    const content = text.trim()
    if (!content) return
    onSend(content)
    setText('')
    isTyping.current = false
    onTypingStop()
    clearTimeout(typingTimer.current)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { data } = await fileApi.upload(channelId, file)
      const f = data.data
      onSend(f.is_image ? `[Image: ${f.file_name}](${f.file_url})` : `[File: ${f.file_name}](${f.file_url})`)
      toast.success('File uploaded!')
    } catch { toast.error('Upload failed (max 10MB)') }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  useEffect(() => { return () => clearTimeout(typingTimer.current) }, [])

  return (
    <div style={{ padding: '0 16px 14px' }}>
      {typing.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 4px 6px', fontSize: 12, color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {[0, 1, 2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
          </div>
          <span>{(typing as any[]).map((u: any) => u.display_name || u.username).join(', ')} {typing.length === 1 ? 'is' : 'are'} typing…</span>
        </div>
      )}

      {replyTo && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'var(--bg-raised)', borderRadius: '8px 8px 0 0', borderLeft: '3px solid var(--brand)' }}>
          <div style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)' }}>
            Replying to <strong style={{ color: 'var(--brand-bright)' }}>{replyTo.sender?.display_name || replyTo.sender?.username}</strong>: {replyTo.content.slice(0, 60)}{replyTo.content.length > 60 ? '…' : ''}
          </div>
          <button onClick={onClearReply} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: replyTo ? '0 0 10px 10px' : 10, padding: '8px 12px', transition: 'border-color .15s' }}>
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 2px', display: 'flex', alignItems: 'center', flexShrink: 0, fontSize: 16 }}>
          📎
        </button>
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFile} accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.csv,.zip" />

        <textarea ref={textareaRef} value={text} onChange={handleChange}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={`Message #${channelName}`}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 13.5, lineHeight: 1.6, resize: 'none', maxHeight: 160, minHeight: 22, fontFamily: 'inherit' }}
          rows={1} />

        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button onClick={() => setShowEmoji(!showEmoji)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 2px', display: 'flex', alignItems: 'center', fontSize: 16 }}>
            😊
          </button>
          {showEmoji && (
            <div style={{ position: 'absolute', bottom: '100%', right: 0, background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 12, padding: 10, display: 'flex', flexWrap: 'wrap', gap: 4, width: 196, zIndex: 30, marginBottom: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => { setText(t => t + e); setShowEmoji(false); textareaRef.current?.focus() }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4, borderRadius: 6 }}>
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={handleSend} disabled={!text.trim() || uploading}
          style={{ background: text.trim() ? 'var(--brand)' : 'transparent', border: 'none', cursor: text.trim() ? 'pointer' : 'default', color: text.trim() ? 'white' : 'var(--text-muted)', padding: '5px 7px', borderRadius: 7, display: 'flex', alignItems: 'center', transition: 'all .15s', flexShrink: 0, fontSize: 14 }}>
          ➤
        </button>
      </div>
    </div>
  )
}
