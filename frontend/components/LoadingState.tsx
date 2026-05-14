// Add this to frontend/components/LoadingState.tsx

export function MessageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 16px' }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, opacity: 1 - i * 0.12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'var(--bg-raised)',
            animation: 'pulse 1.5s ease-in-out infinite',
            flexShrink: 0
          }} />
          <div style={{ flex: 1 }}>
            <div style={{
              height: 11, width: 90,
              background: 'var(--bg-raised)',
              borderRadius: 4, marginBottom: 8,
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
            <div style={{
              height: 14,
              width: `${55 + (i % 3) * 15}%`,
              background: 'var(--bg-raised)',
              borderRadius: 4,
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`
            }} />
            {i % 2 === 0 && (
              <div style={{
                height: 14, width: '35%',
                background: 'var(--bg-raised)',
                borderRadius: 4, marginTop: 6,
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`
              }} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', padding: 32, textAlign: 'center'
    }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <h3 style={{
        fontWeight: 700, fontSize: 16,
        color: 'var(--text-primary)', marginBottom: 6
      }}>
        Something went wrong
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        {message || 'Failed to load messages. Check your connection.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: 'var(--brand)', color: 'white',
            border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13,
            fontWeight: 600, cursor: 'pointer'
          }}
        >
          Try again
        </button>
      )}
    </div>
  )
}

export function ConnectionBanner({ status }: { status: 'connecting' | 'disconnected' }) {
  const isConnecting = status === 'connecting'
  return (
    <div style={{
      background: isConnecting ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
      borderBottom: `1px solid ${isConnecting ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
      padding: '6px 16px',
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 12, color: isConnecting ? '#f59e0b' : '#ef4444',
      flexShrink: 0
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: isConnecting ? '#f59e0b' : '#ef4444',
        animation: isConnecting ? 'pulse 1s infinite' : 'none'
      }} />
      {isConnecting ? 'Connecting to real-time server...' : 'Disconnected — messages may be delayed'}
    </div>
  )
}