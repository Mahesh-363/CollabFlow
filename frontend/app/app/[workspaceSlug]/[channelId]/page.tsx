'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { channelApi, messageApi, workspaceApi } from '@/lib/api'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { useChatSocket, usePresenceSocket } from '@/hooks/useWebSocket'
import { Sidebar } from '@/components/Sidebar'
import { MessageItem } from '@/components/MessageItem'
import { MessageInput } from '@/components/MessageInput'

export default function ChannelPage() {
  const params = useParams()
  const workspaceSlug = params.workspaceSlug as string
  const channelId = params.channelId as string
  const { isAuthenticated } = useAuthStore()
  const [hasHydrated, setHasHydrated] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const { messages, setMessages, setActiveChannel } = useAppStore()
  const [threadMsg, setThreadMsg] = useState<any>(null)
  const [showMembers, setShowMembers] = useState(false)

  useEffect(() => { setHasHydrated(true) }, [])

  const enabled = hasHydrated && isAuthenticated && !!channelId

  const { data: workspaceData } = useQuery({
    queryKey: ['workspace', workspaceSlug],
    queryFn: () => workspaceApi.get(workspaceSlug).then(r => r.data.data),
    enabled,
  })

  const { data: channel } = useQuery({
    queryKey: ['channel', channelId],
    queryFn: () => channelApi.get(channelId).then(r => r.data.data),
    enabled,
  })

  const { data: msgData, isLoading } = useQuery({
    queryKey: ['messages', channelId],
    queryFn: () => messageApi.list(channelId).then(r => r.data),
    enabled,
  })

  useEffect(() => {
    if (msgData?.results) setMessages(channelId, msgData.results)
  }, [msgData, channelId])

  useEffect(() => {
    if (channel) setActiveChannel(channel)
    return () => setActiveChannel(null)
  }, [channel])

  useEffect(() => {
    if (channelId && enabled) channelApi.markRead(channelId).catch(() => {})
  }, [channelId, enabled])

  const channelMessages = messages[channelId] || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [channelMessages.length])

  const { sendMessage, sendTypingStart, sendTypingStop } = useChatSocket(
  enabled ? workspaceSlug : null,
  enabled ? channelId : null
)
  usePresenceSocket()
  const handleSend = useCallback((content: string) => { sendMessage(content) }, [sendMessage])

  const { data: members } = useQuery({
    queryKey: ['channel-members', channelId],
    queryFn: () => channelApi.members(channelId).then(r => r.data.data),
    enabled: showMembers && enabled,
  })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar workspaceSlug={workspaceSlug} workspaceName={workspaceData?.name || '...'} workspaceColor={workspaceData?.icon_color || 'var(--brand)'} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <div style={{ height: 52, padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>#</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{channel?.name || '...'}</span>
            {channel?.description && (
              <>
                <div style={{ width: 1, height: 14, background: 'var(--border)' }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{channel.description}</span>
              </>
            )}
          </div>
          <button className="btn-ghost" style={{ padding: '5px 8px', fontSize: 13 }} onClick={() => setShowMembers(!showMembers)}>
            👥 {channel?.member_count || 0}
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden auto', padding: '16px 0' }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 16px' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-raised)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 12, width: 100, background: 'var(--bg-raised)', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 14, width: '60%', background: 'var(--bg-raised)', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : channelMessages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>#</div>
              <h3 style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', marginBottom: 6 }}>Start of #{channel?.name}</h3>
              <p style={{ fontSize: 14 }}>{channel?.description || 'Send a message to get started!'}</p>
            </div>
          ) : (
            <div>
              {channelMessages.map((msg: any) => (
                <MessageItem key={msg.id} message={msg} onThreadOpen={setThreadMsg} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <MessageInput channelId={channelId} channelName={channel?.name || ''} onSend={handleSend} onTypingStart={sendTypingStart} onTypingStop={sendTypingStop} />
      </div>

      {showMembers && (
        <div style={{ width: 240, borderLeft: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden auto' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Members</div>
          <div style={{ padding: 8 }}>
            {(members || []).map((m: any) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.user?.avatar_color || 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>
                  {m.user?.initials || m.user?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{m.user?.display_name || m.user?.username}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{m.user?.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {threadMsg && (
        <div style={{ width: 360, borderLeft: '1px solid var(--border)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Thread</span>
            <button className="btn-ghost" style={{ padding: 4 }} onClick={() => setThreadMsg(null)}>✕</button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden auto', padding: '12px 0' }}>
            <MessageItem message={threadMsg} isThread />
          </div>
        </div>
      )}
    </div>
  )
}