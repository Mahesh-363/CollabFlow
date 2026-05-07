'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { usePresenceSocket, useNotificationSocket } from '@/hooks/useWebSocket'
import { toast } from 'react-hot-toast'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => { setHasHydrated(true) }, [])

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      window.location.href = '/login'
    }
  }, [hasHydrated, isAuthenticated])

  usePresenceSocket()
  useNotificationSocket((n: any) => {
    toast(n.title, { icon: '🔔', duration: 4000 })
  })

  if (!hasHydrated || !isAuthenticated) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', color: 'var(--text-muted)' }}>
      Loading...
    </div>
  )

  return <>{children}</>
}