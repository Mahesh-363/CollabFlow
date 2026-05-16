'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { workspaceApi, authApi, api } from '@/lib/api'
import { Sidebar } from '@/components/Sidebar'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'react-hot-toast'

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316']

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.workspaceSlug as string
  const { user, updateUser, isAuthenticated } = useAuthStore()
  const [hasHydrated, setHasHydrated] = useState(false)
  const [tab, setTab] = useState('profile')
  const [deleteConfirm, setDeleteConfirm] = useState('')

  useEffect(() => { setHasHydrated(true) }, [])

  const enabled = hasHydrated && isAuthenticated

  const { data: workspace } = useQuery({
    queryKey: ['workspace', slug],
    queryFn: () => workspaceApi.get(slug).then(r => r.data.data),
    enabled
  })

  const [profile, setProfile] = useState({ display_name: user?.display_name || '', bio: '', avatar_color: user?.avatar_color || '#6366f1' })

  const updateProfile = useMutation({
    mutationFn: (d: any) => authApi.updateProfile(d),
    onSuccess: (res) => { updateUser(res.data); toast.success('Profile updated!') },
    onError: () => toast.error('Failed to update'),
  })

  const [pwd, setPwd] = useState({ old_password: '', new_password: '', new_password_confirm: '' })
  const changePwd = useMutation({
    mutationFn: (d: any) => authApi.changePassword(d),
    onSuccess: () => { toast.success('Password changed!'); setPwd({ old_password: '', new_password: '', new_password_confirm: '' }) },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Failed'),
  })

  const deleteWorkspace = useMutation({
    mutationFn: () => api.delete(`/workspaces/${slug}/`),
    onSuccess: () => { toast.success('Workspace deleted'); router.push('/app') },
    onError: () => toast.error('Failed to delete workspace'),
  })

  const isOwner = workspace?.current_user_role === 'owner'

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Password' },
    ...(isOwner ? [{ id: 'workspace', label: 'Workspace' }] : []),
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <Sidebar workspaceSlug={slug} workspaceName={workspace?.name || '...'} workspaceColor={workspace?.icon_color || 'var(--brand)'} />
      <div style={{ flex: 1, overflow: 'hidden auto', padding: '40px 48px' }}>
        <div style={{ maxWidth: 680 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 28 }}>Settings</h1>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ width: 160, flexShrink: 0 }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 600 : 400, background: tab === t.id ? 'rgba(99,102,241,0.12)' : 'transparent', color: tab === t.id ? 'var(--brand-bright)' : 'var(--text-secondary)', marginBottom: 2, textAlign: 'left' }}>
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1 }}>
              {tab === 'profile' && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                  <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 20 }}>Profile</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: profile.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white' }}>
                      {user?.initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{user?.display_name || user?.username}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user?.email}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Avatar Color</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {COLORS.map(c => (
                        <button key={c} onClick={() => setProfile({ ...profile, avatar_color: c })}
                          style={{ width: 26, height: 26, borderRadius: '50%', background: c, border: profile.avatar_color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer' }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>Display Name</label>
                    <input className="input-field" value={profile.display_name} onChange={e => setProfile({ ...profile, display_name: e.target.value })} placeholder="Your name" />
                  </div>
                  <button className="btn-primary" onClick={() => updateProfile.mutate(profile)} disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {tab === 'password' && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                  <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 20 }}>Change Password</h2>
                  {[['old_password', 'Current Password'], ['new_password', 'New Password'], ['new_password_confirm', 'Confirm New Password']].map(([k, l]) => (
                    <div key={k} style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{l}</label>
                      <input className="input-field" type="password" placeholder="••••••••" value={(pwd as any)[k]} onChange={e => setPwd({ ...pwd, [k]: e.target.value })} />
                    </div>
                  ))}
                  <button className="btn-primary" onClick={() => changePwd.mutate(pwd)} disabled={changePwd.isPending || !pwd.old_password || !pwd.new_password}>
                    {changePwd.isPending ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              )}

              {tab === 'workspace' && isOwner && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                    <h2 style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>Workspace Info</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>Slug: <code style={{ background: 'var(--bg-raised)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{slug}</code></p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Plan: <strong style={{ color: 'var(--text-primary)' }}>{workspace?.plan || 'Free'}</strong></p>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 24 }}>
                    <h2 style={{ fontWeight: 700, fontSize: 16, color: '#ef4444', marginBottom: 6 }}>Danger Zone</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                      Deleting a workspace is permanent. All channels, messages and members will be removed.
                    </p>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                        Type <strong>{workspace?.name}</strong> to confirm
                      </label>
                      <input
                        className="input-field"
                        placeholder={workspace?.name}
                        value={deleteConfirm}
                        onChange={e => setDeleteConfirm(e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => deleteWorkspace.mutate()}
                      disabled={deleteConfirm !== workspace?.name || deleteWorkspace.isPending}
                      style={{
                        background: deleteConfirm === workspace?.name ? '#ef4444' : 'transparent',
                        color: deleteConfirm === workspace?.name ? 'white' : '#ef4444',
                        border: '1px solid #ef4444',
                        borderRadius: 8, padding: '8px 16px', fontSize: 13,
                        fontWeight: 600, cursor: deleteConfirm === workspace?.name ? 'pointer' : 'not-allowed',
                        opacity: deleteConfirm === workspace?.name ? 1 : 0.5,
                      }}
                    >
                      {deleteWorkspace.isPending ? 'Deleting...' : 'Delete Workspace'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}