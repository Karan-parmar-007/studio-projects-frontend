import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onUnauthenticated, sso, type SsoSession, type SsoUser } from '@/lib/sso'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'unavailable'

type AuthState = {
  user: SsoUser | null
  status: AuthStatus
  refetch: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SsoUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  const apply = useCallback((session: SsoSession) => {
    if (session.authenticated && session.user) {
      setUser(session.user)
      setStatus('authenticated')
    } else {
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const refetch = useCallback(async () => {
    try {
      apply(await sso.getSession())
    } catch {
      setUser(null)
      setStatus('unavailable')
    }
  }, [apply])

  const logout = useCallback(async () => {
    try {
      await sso.logout()
    } catch {
      /* the client still clears local state */
    }
    setUser(null)
    setStatus('anonymous')
  }, [])

  useEffect(() => {
    let active = true
    sso.getSession().then(
      (session) => {
        if (active) apply(session)
      },
      () => {
        if (active) setStatus('unavailable')
      },
    )
    return () => {
      active = false
    }
  }, [apply])

  useEffect(() => sso.onSessionChange(apply), [apply])
  useEffect(
    () =>
      onUnauthenticated(() => {
        setUser(null)
        setStatus('anonymous')
      }),
    [],
  )

  const value = useMemo(() => ({ user, status, refetch, logout }), [user, status, refetch, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
