import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  name: string
  email: string
  roles: string[]
  activeRole: string
  walletBalance: number
}

interface AuthState {
  user: AuthUser | null
  activeRole: string | null
  token: string | null
  isLoading: boolean
  setAuth: (user: AuthUser, token: string) => void
  setActiveRole: (role: string) => void
  updateWallet: (balance: number) => void
  storeProfile: { name: string; imageUrl: string | null } | null
  setStoreProfile: (profile: { name: string; imageUrl: string | null } | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      activeRole: null,
      token: null,
      isLoading: false,
      storeProfile: null,

      setAuth: (user, token) => {
        set({ user, token, activeRole: user.activeRole })
      },

      setActiveRole: (role) => {
        const user = get().user
        if (!user || !user.roles.includes(role)) return
        set({ user: { ...user, activeRole: role }, activeRole: role })
        // Also update cookie via API
        fetch('/api/auth/switch-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.token) {
              set({ token: data.token })
            }
          })
          .catch(console.error)
      },

      setStoreProfile: (profile) => set({ storeProfile: profile }),

      updateWallet: (balance) => {
        const user = get().user
        if (!user) return
        set({ user: { ...user, walletBalance: balance } })
      },

      logout: () => {
        set({ user: null, token: null, activeRole: null })
        fetch('/api/auth/logout', { method: 'POST' }).catch(console.error)
      },
    }),
    {
      name: 'seapedia-auth',
      partialize: (state) => ({ user: state.user, token: state.token, activeRole: state.activeRole }),
    }
  )
)
