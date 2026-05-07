import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authApi } from '@/lib/api'

interface User {
  id: string
  email: string
  username: string
  display_name: string
  avatar_url: string | null
  avatar_color: string
  initials: string
  bio: string
  is_verified: boolean
  last_seen: string | null
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => Promise<void>
  updateUser: (data: Partial<User>) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false })
      },

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await authApi.login(email, password)
          const payload = res.data?.data || res.data
          const access = payload.tokens?.access || payload.access
          const refresh = payload.tokens?.refresh || payload.refresh
          const user = payload.user

          if (!access) throw new Error('No access token received')

          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', access)
            if (refresh) localStorage.setItem('refresh_token', refresh)
          }

          set({ accessToken: access, refreshToken: refresh || null, user: user || null, isAuthenticated: true, isLoading: false })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      register: async (formData) => {
        set({ isLoading: true })
        try {
          const res = await authApi.register(formData)
          const payload = res.data?.data || res.data
          const access = payload.tokens?.access || payload.access
          const refresh = payload.tokens?.refresh || payload.refresh
          const user = payload.user

          if (!access) throw new Error('No access token received')

          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', access)
            if (refresh) localStorage.setItem('refresh_token', refresh)
          }

          set({ accessToken: access, refreshToken: refresh || null, user: user || null, isAuthenticated: true, isLoading: false })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: async () => {
        const refresh = get().refreshToken
        get().clearAuth()
        if (refresh) {
          try { await authApi.logout(refresh) } catch {}
        }
      },

      updateUser: (data) => set((s) => ({ user: s.user ? { ...s.user, ...data } : null })),
    }),
    {
      name: 'collabflow-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }),
    }
  )
)