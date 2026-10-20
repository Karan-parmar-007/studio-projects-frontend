import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { sso } from '@/lib/sso'
import { useAuth } from '@/components/Auth'

const PORTFOLIO = 'https://karanparmar.in'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `font-mono text-xs tracking-wide transition-colors ${
    isActive ? 'text-green' : 'text-light-slate hover:text-green'
  }`

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
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-navy-border/80 bg-navy/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
          <Link to="/" className="font-mono text-lg font-semibold text-green">
            studio
          </Link>
          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-5 md:flex">
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
              className="rounded border border-navy-border px-3 py-2 font-mono text-xs text-light-slate md:hidden"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((open) => !open)}
            >
              Menu
            </button>
          </div>
        </div>
        {navOpen ? (
          <div className="border-t border-navy-border px-4 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <TextLinks signedIn={Boolean(user)} />
              {status !== 'loading' && !user ? (
                <a href={sso.signupUrl('/dashboard')} className="w-fit rounded border border-green px-3 py-2 font-mono text-xs text-green">
                  Sign up
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </header>
      <main className={appRoute(pathname) ? '' : 'mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-12'}>{children}</main>
    </div>
  )
}

function TextLinks({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      <a href={PORTFOLIO} className="font-mono text-xs tracking-wide text-light-slate hover:text-green">
        Portfolio
      </a>
      {signedIn ? (
        <NavLink to="/dashboard" className={linkClass}>
          Dashboard
        </NavLink>
      ) : (
        <a href={sso.loginUrl('/dashboard')} className="font-mono text-xs text-light-slate hover:text-green">
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
    return <span className="h-9 w-9 animate-pulse rounded-full border border-green/30" />
  }
  if (!user) {
    return (
      <a
        href={sso.signupUrl('/dashboard')}
        className="hidden rounded border border-green px-3 py-2 font-mono text-xs text-green hover:bg-green-tint md:inline-flex"
      >
        Sign up
      </a>
    )
  }
  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-green font-mono text-sm text-green hover:bg-green-tint"
      >
        {letter}
      </button>
      {menuOpen ? (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-[min(16rem,calc(100vw-2rem))] rounded border border-navy-border bg-light-navy p-3 shadow-xl">
          <p className="truncate text-sm font-semibold text-lightest-slate">{user.name || user.email}</p>
          <p className="mt-1 break-all font-mono text-xs text-slate">{user.email}</p>
          <a href={sso.accountUrl()} className="mt-3 block rounded px-2 py-2 text-sm text-light-slate hover:bg-navy hover:text-green">
            Edit
          </a>
          <button
            type="button"
            onClick={() => void logout()}
            className="block w-full rounded px-2 py-2 text-left text-sm text-light-slate hover:bg-navy hover:text-[#ff8b8b]"
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function Gate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth()
  const { pathname } = useLocation()
  if (status === 'loading') {
    return <p className="px-4 py-10 font-mono text-sm text-green">Checking your session…</p>
  }
  if (status === 'unavailable') {
    return (
      <p className="max-w-md px-4 py-10 text-light-slate">
        Sign-in is not reachable. The SSO service needs to be running, then refresh this page.
      </p>
    )
  }
  if (status === 'anonymous') {
    return (
      <div className="max-w-md px-4 py-10">
        <p className="mb-6 text-light-slate">Sign in with the same account you use on the other sites.</p>
        <a
          href={sso.loginUrl(pathname)}
          className="inline-flex rounded border border-green px-6 py-3 font-mono text-sm text-green hover:bg-green-tint"
        >
          Continue with SSO
        </a>
      </div>
    )
  }
  return children
}
