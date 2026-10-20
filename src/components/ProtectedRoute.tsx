import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { useAuth } from '@/components/Auth'
import { sso } from '@/lib/sso'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, status } = useAuth()
  const location = useLocation()
  const returnTarget = location.pathname + location.search

  useEffect(() => {
    if (status === 'anonymous' || (status !== 'loading' && !user)) {
      window.location.replace(sso.loginUrl(returnTarget))
    }
  }, [status, user, returnTarget])

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-green border-t-transparent" />
        <p className="font-mono text-xs text-light-slate">Verifying session…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-center">
        <div className="w-full max-w-md rounded-2xl border border-navy-border bg-light-navy/80 p-8 shadow-2xl backdrop-blur-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-green/30 bg-green-tint text-green">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-lightest-slate">Sign in Required</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            Studio products, docs, playground, and API keys are protected. Sign in with your SSO account to continue.
          </p>
          <a
            href={sso.loginUrl(returnTarget)}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-green px-6 py-3 font-mono text-xs font-semibold text-navy transition-all hover:bg-green/90 active:scale-95"
          >
            Sign in to Studio →
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
