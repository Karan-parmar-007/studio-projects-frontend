import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { sso } from '@/lib/sso'
import { useAuth } from '@/components/Auth'
import { User, LogOut, ArrowRight, Menu, X } from 'lucide-react'

const PORTFOLIO = 'https://karanparmar.in'

function appRoute(pathname: string): boolean {
  return pathname === '/dashboard' || pathname === '/keys' || pathname === '/admin'
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { user, status, logout } = useAuth()
  const { pathname } = useLocation()
  const [navOpen, setNavOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const letter = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase()

  useEffect(() => {
    setNavOpen(false)
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="min-h-screen bg-navy text-light-slate flex flex-col">
      <header className="sticky top-0 z-30 border-b border-navy-border bg-navy/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green/10 border border-green/30 text-green font-mono font-bold text-base group-hover:bg-green group-hover:text-ink transition-all">
              S
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-white tracking-tight">Studio</span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-6 md:flex">
              <TextLinks signedIn={Boolean(user)} />
            </nav>

            <Account
              status={status}
              user={user}
              letter={letter}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              menuRef={menuRef}
              logout={logout}
            />

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-navy-border bg-light-navy text-slate hover:text-white md:hidden"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((open) => !open)}
            >
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {navOpen && (
          <div className="border-t border-navy-border px-4 py-4 md:hidden bg-light-navy">
            <div className="flex flex-col gap-3">
              <TextLinks signedIn={Boolean(user)} />
              {status !== 'loading' && !user && (
                <div className="flex flex-col gap-2 pt-2 border-t border-navy-border">
                  <a
                    href={sso.signupUrl('/dashboard')}
                    className="inline-flex items-center justify-center rounded-xl bg-green px-4 py-2 text-sm font-semibold text-ink hover:bg-green/90"
                  >
                    Sign up
                  </a>
                  <a
                    href={sso.loginUrl('/dashboard')}
                    className="inline-flex items-center justify-center rounded-xl border border-navy-border bg-navy px-4 py-2 text-sm font-medium text-slate hover:text-white"
                  >
                    Sign in
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className={appRoute(pathname) ? 'flex-1' : 'flex-1 mx-auto max-w-[90rem] w-full px-4 py-10 sm:px-8 sm:py-12'}>
        {children}
      </main>

      {/* Clean Footer on Public Views */}
      {!appRoute(pathname) && (
        <footer className="mt-16 border-t border-navy-border/60 bg-light-navy py-8">
          <div className="mx-auto max-w-[90rem] px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Studio</span>
              <span>•</span>
              <span>Nothing you send is stored.</span>
            </div>
            <div className="flex items-center gap-4">
              <a href={PORTFOLIO} target="_blank" rel="noopener noreferrer" className="hover:text-green transition-colors">
                karanparmar.in
              </a>
              <span>•</span>
              <a href={sso.loginUrl('/dashboard')} className="hover:text-green transition-colors">
                Console Login
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

function TextLinks({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      <a
        href={PORTFOLIO}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-slate hover:text-white transition-colors"
      >
        Portfolio ↗
      </a>
      {signedIn ? (
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `text-sm font-medium transition-colors ${
              isActive ? 'text-green font-semibold' : 'text-slate hover:text-white'
            }`
          }
        >
          Console Dashboard
        </NavLink>
      ) : (
        <a
          href={sso.loginUrl('/dashboard')}
          className="text-sm font-medium text-slate hover:text-white transition-colors"
        >
          Sign in
        </a>
      )}
    </>
  )
}

function Account({
  status,
  user,
  letter,
  menuOpen,
  setMenuOpen,
  menuRef,
  logout,
}: {
  status: string
  user: { name: string; email: string } | null
  letter: string
  menuOpen: boolean
  setMenuOpen: (open: boolean) => void
  menuRef: RefObject<HTMLDivElement | null>
  logout: () => Promise<void>
}) {
  if (status === 'loading') {
    return <span className="h-9 w-9 animate-pulse rounded-full border border-green/30 bg-light-navy" />
  }
  if (!user) {
    return (
      <div className="hidden items-center gap-3 md:flex">
        <a
          href={sso.loginUrl('/dashboard')}
          className="rounded-xl px-4 py-2 text-sm font-medium text-slate hover:text-white transition-colors"
        >
          Sign in
        </a>
        <a
          href={sso.signupUrl('/dashboard')}
          className="inline-flex items-center gap-1.5 rounded-xl bg-green px-4 py-2 text-sm font-semibold text-ink hover:bg-green/90 transition-all shadow-sm"
        >
          <span>Sign up</span>
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    )
  }
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-green/50 bg-green-tint font-bold text-sm text-green hover:bg-green hover:text-ink transition-all"
      >
        {letter}
      </button>
      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 rounded-2xl border border-navy-border bg-light-navy p-3 shadow-2xl backdrop-blur-md"
        >
          <div className="px-2 py-1.5 border-b border-navy-border/60 pb-2">
            <p className="truncate text-sm font-bold text-white">{user.name || 'Studio User'}</p>
            <p className="truncate text-xs text-slate mt-0.5">{user.email}</p>
          </div>
          <div className="mt-2 space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-light-slate hover:bg-navy hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              to="/keys"
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-light-slate hover:bg-navy hover:text-white transition-colors"
            >
              API Keys
            </Link>
            <a
              href={sso.accountUrl()}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-light-slate hover:bg-navy hover:text-white transition-colors"
            >
              <User className="h-3.5 w-3.5 text-green" />
              <span>SSO Account</span>
            </a>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
