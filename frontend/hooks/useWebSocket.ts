'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

export function useChatSocket(
  workspaceSlug: string | null,
  channelId: string | null
) {
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<any>(null)
  const { accessToken } = useAuthStore()
  const { addMessage, updateMessage, deleteMessage, setTyping } = useAppStore()

  const connect = useCallback(() => {
    if (!workspaceSlug || !channelId || !accessToken) return
    ws.current?.close()

    console.log('WS TOKEN:', accessToken)

    const socket = new WebSocket(
      `${WS_URL}/ws/chat/${workspaceSlug}/${channelId}/?token=${accessToken}`
)

    socket.onopen = () => console.log(`[WS] Connected to channel ${channelId}`)

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)

        switch (data.type) {
          case 'message':
            addMessage(channelId, data.message)
            break

          case 'message_edited':
            updateMessage(channelId, data.message)
            break

          case 'message_deleted':
            deleteMessage(channelId, data.message_id)
            break

          case 'typing':
            setTyping(
              channelId,
              {
                user_id: data.user_id,
                username: data.username,
                display_name: data.display_name
              },
              data.is_typing
            )
            break
        }
      } catch {}
    }

    socket.onclose = (e) => {
        if (e.code !== 1000) {
          reconnectTimer.current = setTimeout(connect, 3000)
        }
    }

    ws.current = socket
  }, [channelId, accessToken])

  useEffect(() => {
    connect()

    return () => {
      clearTimeout(reconnectTimer.current)
      ws.current?.close(1000, 'unmount')
    }
  }, [connect])

  const sendMessage = useCallback((content: string, parentId?: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: 'message',
          content,
          parent_id: parentId
        })
      )
    }
  }, [])

  const sendTypingStart = useCallback(() => {
    ws.current?.readyState === WebSocket.OPEN &&
      ws.current.send(JSON.stringify({ type: 'typing_start' }))
  }, [])

  const sendTypingStop = useCallback(() => {
    ws.current?.readyState === WebSocket.OPEN &&
      ws.current.send(JSON.stringify({ type: 'typing_stop' }))
  }, [])

  return {
    sendMessage,
    sendTypingStart,
    sendTypingStop
  }
}

export function usePresenceSocket() {
  const ws = useRef<WebSocket | null>(null)
  const { accessToken } = useAuthStore()
  const { setPresence, setPresenceSnapshot } = useAppStore()

  useEffect(() => {
    if (!accessToken) return

    return
  }, [accessToken])
}

export function useNotificationSocket(onNotification?: (data: any) => void) {
  const ws = useRef<WebSocket | null>(null)
  const { accessToken } = useAuthStore()
  const { setUnreadNotifications } = useAppStore()

  useEffect(() => {
    if (!accessToken) return

    return
  }, [accessToken])
}