'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/app')
    } else {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a1d21',
      color: '#9ca3af',
      fontSize: 14,
    }}>
      Loading…
    </div>
  )
}
