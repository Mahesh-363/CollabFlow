import { create } from 'zustand'

interface AppState {
  workspaces: any[]
  activeWorkspace: any | null
  setWorkspaces: (ws: any[]) => void
  setActiveWorkspace: (ws: any | null) => void

  channels: any[]
  activeChannel: any | null
  setChannels: (chs: any[]) => void
  setActiveChannel: (ch: any | null) => void
  updateChannelUnread: (channelId: string, count: number) => void

  messages: Record<string, any[]>
  setMessages: (channelId: string, msgs: any[]) => void
  addMessage: (channelId: string, msg: any) => void
  updateMessage: (channelId: string, msg: any) => void
  deleteMessage: (channelId: string, msgId: string) => void

  presenceMap: Record<string, string>
  setPresence: (userId: string, status: string) => void
  setPresenceSnapshot: (data: Array<{ user_id: string; status: string }>) => void

  typingUsers: Record<string, Array<{ user_id: string; username: string; display_name: string }>>
  setTyping: (channelId: string, user: { user_id: string; username: string; display_name: string }, isTyping: boolean) => void

  unreadNotifications: number
  setUnreadNotifications: (n: number) => void

  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  workspaces: [],
  activeWorkspace: null,
  setWorkspaces: (workspaces) => set({ workspaces }),
  setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),

  channels: [],
  activeChannel: null,
  setChannels: (channels) => set({ channels }),
  setActiveChannel: (activeChannel) => set({ activeChannel }),
  updateChannelUnread: (channelId, count) => set((s) => ({ channels: s.channels.map((c) => c.id === channelId ? { ...c, unread_count: count } : c) })),

  messages: {},
  setMessages: (channelId, msgs) => set((s) => ({ messages: { ...s.messages, [channelId]: msgs } })),
  addMessage: (channelId, msg) => set((s) => ({ messages: { ...s.messages, [channelId]: [...(s.messages[channelId] || []), msg] } })),
  updateMessage: (channelId, msg) => set((s) => ({ messages: { ...s.messages, [channelId]: (s.messages[channelId] || []).map((m) => m.id === msg.id ? msg : m) } })),
  deleteMessage: (channelId, msgId) => set((s) => ({ messages: { ...s.messages, [channelId]: (s.messages[channelId] || []).map((m) => m.id === msgId ? { ...m, is_deleted: true, content: '[Message deleted]' } : m) } })),

  presenceMap: {},
  setPresence: (userId, status) => set((s) => ({ presenceMap: { ...s.presenceMap, [userId]: status } })),
  setPresenceSnapshot: (data) => {
    const map: Record<string, string> = {}
    data.forEach(({ user_id, status }) => { map[user_id] = status })
    set((s) => ({ presenceMap: { ...s.presenceMap, ...map } }))
  },

  typingUsers: {},
  setTyping: (channelId, user, isTyping) => set((s) => {
    const current = s.typingUsers[channelId] || []
    const updated = isTyping
      ? (current.find((u) => u.user_id === user.user_id) ? current : [...current, user])
      : current.filter((u) => u.user_id !== user.user_id)
    return { typingUsers: { ...s.typingUsers, [channelId]: updated } }
  }),

  unreadNotifications: 0,
  setUnreadNotifications: (n) => set({ unreadNotifications: n }),

  sidebarOpen: true,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}))