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
        <p className="text-xs font-semibold text-slate">Verifying Studio session…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-center">
        <div className="w-full max-w-md rounded-3xl border border-navy-border bg-light-navy/90 p-8 shadow-2xl backdrop-blur-md space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-green/30 bg-green-tint text-green shadow-sm">
            <LogIn className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-white">Sign in Required</h2>
          <p className="text-sm leading-relaxed text-slate">
            Studio products, docs, playground, and API keys are protected. Sign in with your SSO account to continue.
          </p>
          <a
            href={sso.loginUrl(returnTarget)}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-green px-6 py-3 text-xs font-semibold text-ink transition-all hover:bg-green/90 shadow-md active:scale-95"
          >
            Sign in to Studio →
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
