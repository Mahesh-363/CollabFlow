import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) throw new Error('No refresh token')
        const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register:       (data: any) => api.post('/auth/register/', data),
  login:          (email: string, password: string) => api.post('/auth/login/', { email, password }),
  logout:         (refresh: string) => api.post('/auth/logout/', { refresh }),
  profile:        () => api.get('/auth/profile/'),
  updateProfile:  (data: any) => api.patch('/auth/profile/', data),
  changePassword: (data: any) => api.post('/auth/change-password/', data),
  searchUsers:    (q: string) => api.get(`/auth/search/?q=${q}`),
}

export const workspaceApi = {
  list:    () => api.get('/workspaces/'),
  create:  (data: any) => api.post('/workspaces/', data),
  get:     (slug: string) => api.get(`/workspaces/${slug}/`),
  update:  (slug: string, data: any) => api.patch(`/workspaces/${slug}/`, data),
  members: (slug: string) => api.get(`/workspaces/${slug}/members/`),
  join:    (slug: string) => api.post(`/workspaces/${slug}/join/`),
  leave:   (slug: string) => api.delete(`/workspaces/${slug}/leave/`),
}

export const channelApi = {
  list:     (workspaceSlug: string, type = 'public') => api.get(`/channels/workspace/${workspaceSlug}/?type=${type}`),
  mine:     (workspaceSlug: string) => api.get(`/channels/workspace/${workspaceSlug}/mine/`),
  create:   (workspaceSlug: string, data: any) => api.post(`/channels/workspace/${workspaceSlug}/`, data),
  get:      (id: string) => api.get(`/channels/${id}/`),
  update:   (id: string, data: any) => api.patch(`/channels/${id}/`, data),
  join:     (id: string) => api.post(`/channels/${id}/join/`),
  leave:    (id: string) => api.delete(`/channels/${id}/leave/`),
  markRead: (id: string) => api.post(`/channels/${id}/read/`),
  members:  (id: string) => api.get(`/channels/${id}/members/`),
}

export const messageApi = {
  list:    (channelId: string, cursor?: string) => api.get(`/messages/channel/${channelId}/`, { params: cursor ? { cursor } : {} }),
  send:    (channelId: string, data: any) => api.post(`/messages/channel/${channelId}/send/`, data),
  edit:    (id: string, content: string) => api.put(`/messages/${id}/edit/`, { content }),
  delete:  (id: string) => api.delete(`/messages/${id}/delete/`),
  react:   (id: string, emoji: string) => api.post(`/messages/${id}/reactions/`, { emoji }),
  unreact: (id: string, emoji: string) => api.delete(`/messages/${id}/reactions/`, { data: { emoji } }),
  thread:  (id: string) => api.get(`/messages/${id}/thread/`),
  search:  (q: string, workspace?: string) => api.get(`/messages/search/?q=${q}${workspace ? `&workspace=${workspace}` : ''}`),
}

export const notificationApi = {
  list:        () => api.get('/notifications/'),
  unreadCount: () => api.get('/notifications/unread-count/'),
  markRead:    (id: string) => api.post(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/mark-all-read/'),
}

export const fileApi = {
  upload: (channelId: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post(`/files/upload/${channelId}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  channelFiles: (channelId: string) => api.get(`/files/channel/${channelId}/`),
}