'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import axios from 'axios'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Refresh access token if expired, return valid token
async function getValidToken(): Promise<string | null> {
  const store = useAuthStore.getState()
  let token = store.accessToken || localStorage.getItem('access_token')
  if (!token) return null

  // Check if token is expired (JWT payload is base64 encoded)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const expiresAt = payload.exp * 1000
    const isExpired = Date.now() >= expiresAt - 30000 // refresh 30s before expiry

    if (isExpired) {
      const refresh = store.refreshToken || localStorage.getItem('refresh_token')
      if (!refresh) return null
      const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh })
      token = data.access
      localStorage.setItem('access_token', token!)
      useAuthStore.setState({ accessToken: token })
    }
  } catch {
    return token // if parsing fails just use existing token
  }

  return token
}

export function useChatSocket(
  workspaceSlug: string | null,
  channelId: string | null
) {
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<any>(null)
  const { accessToken } = useAuthStore()
  const { addMessage, updateMessage, deleteMessage, setTyping } = useAppStore()

  const connect = useCallback(async () => {
    if (!workspaceSlug || !channelId || !accessToken) return
    ws.current?.close()

    const token = await getValidToken()
    if (!token) return

    const socket = new WebSocket(
      `${WS_URL}/ws/chat/${workspaceSlug}/${channelId}/?token=${token}`
    )

    socket.onopen = () => console.log(`[WS] Chat connected to channel ${channelId}`)

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
              { user_id: data.user_id, username: data.username, display_name: data.display_name },
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
      ws.current.send(JSON.stringify({ type: 'message', content, parent_id: parentId }))
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

  return { sendMessage, sendTypingStart, sendTypingStop }
}

export function usePresenceSocket() {
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<any>(null)
  const { accessToken } = useAuthStore()
  const { setPresence, setPresenceSnapshot } = useAppStore()

  useEffect(() => {
    if (!accessToken) return

    const connect = async () => {
      const token = await getValidToken()
      if (!token) return

      const socket = new WebSocket(`${WS_URL}/ws/presence/?token=${token}`)

      socket.onopen = () => console.log('[WS] Presence connected')

      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'presence_snapshot') {
            setPresenceSnapshot(data.data)
          } else if (data.type === 'presence_update') {
            setPresence(data.user_id, data.status)
          }
        } catch {}
      }

      socket.onclose = (e) => {
        if (e.code !== 1000) {
          reconnectTimer.current = setTimeout(connect, 3000)
        }
      }

      ws.current = socket
    }

    connect()

    return () => {
      clearTimeout(reconnectTimer.current)
      ws.current?.close(1000, 'unmount')
    }
  }, [accessToken])
}

export function useNotificationSocket(onNotification?: (data: any) => void) {
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<any>(null)
  const { accessToken } = useAuthStore()
  const { setUnreadNotifications } = useAppStore()

  useEffect(() => {
    if (!accessToken) return

    const connect = async () => {
      const token = await getValidToken()
      if (!token) return

      const socket = new WebSocket(`${WS_URL}/ws/notifications/?token=${token}`)

      socket.onopen = () => console.log('[WS] Notifications connected')

      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'notification') {
            setUnreadNotifications(data.data?.unread_count || 0)
            onNotification?.(data)
          } else if (data.type === 'connected') {
            setUnreadNotifications(data.unread_count || 0)
          }
        } catch {}
      }

      socket.onclose = (e) => {
        if (e.code !== 1000) {
          reconnectTimer.current = setTimeout(connect, 3000)
        }
      }

      ws.current = socket
    }

    connect()

    return () => {
      clearTimeout(reconnectTimer.current)
      ws.current?.close(1000, 'unmount')
    }
  }, [accessToken])
}