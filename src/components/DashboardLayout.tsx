import { useState, useEffect, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Key,
  Shield,
  ExternalLink,
  Menu,
  X,
  User,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/components/Auth'
import { FadeIn } from '@/components/Fade'
import { ServiceClosed } from '@/components/ServiceClosed'
import { activePage, activeProduct, productNav, type ProductNav } from '@/lib/products'
import { serviceOpen, useServices } from '@/lib/services'
import { isAppAdmin, sso } from '@/lib/sso'

const PORTFOLIO_URL = 'https://karanparmar.in'

function pageBody(
  product: ProductNav | null,
  projects: ReturnType<typeof useServices>['projects'],
  children: ReactNode,
) {
  if (!product || serviceOpen(projects, product.slug)) return children
  return <ServiceClosed name={product.name} />
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, status, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [listOpen, setListOpen] = useState(true)

  const { projects } = useServices()
  const products = productNav(projects)
  const current = activeProduct(location.pathname, products)
  const currentSlug = current?.slug ?? null
  // Only the product you are on is open. Opening another one closes the rest.
  const [expanded, setExpanded] = useState<string | null>(currentSlug)
  const admin = isAppAdmin(user, 'studio')
  const letter = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase()

  useEffect(() => {
    if (currentSlug) setExpanded(currentSlug)
  }, [currentSlug])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Get readable breadcrumb title
  const getBreadcrumbs = () => {
    const path = location.pathname
    if (path === '/dashboard') return [{ label: 'Dashboard', to: '/dashboard' }]
    if (current) {
      const page = activePage(path, current)
      return [
        { label: 'Products', to: '/dashboard' },
        { label: current.name, to: current.base },
        { label: page.crumb, to: page.path },
      ]
    }
    if (path.startsWith('/keys')) return [{ label: 'Dashboard', to: '/dashboard' }, { label: 'API Keys', to: '/keys' }]
    if (path.startsWith('/admin')) return [{ label: 'Dashboard', to: '/dashboard' }, { label: 'Admin Settings', to: '/admin' }]
    return [{ label: 'Dashboard', to: '/dashboard' }]
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="flex min-h-screen bg-navy text-light-slate">
      {/* Mobile Top Header */}
      <header className="fixed top-0 inset-x-0 z-40 flex h-16 items-center justify-between border-b border-navy-border bg-navy/95 px-4 backdrop-blur-md md:hidden">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-tint border border-green/30 text-green font-mono font-bold text-sm">
            S
          </div>
          <span className="font-sans text-lg font-bold text-white tracking-tight">Studio</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-navy-border bg-light-navy text-slate hover:text-white"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Backdrop for Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-navy-border bg-light-navy transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Workspace & Brand */}
        <div className="flex h-16 items-center justify-between border-b border-navy-border px-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green/10 border border-green/30 text-green font-mono font-bold text-sm group-hover:bg-green group-hover:text-ink transition-all">
              S
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-tight">Studio</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* Main Navigation Links */}
          <div className="space-y-1">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate/70">
              Navigation
            </p>

            {/* Dashboard Link */}
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-green/10 text-green border border-green/25 font-semibold shadow-sm'
                    : 'text-slate hover:bg-light-navy hover:text-white'
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>Dashboard</span>
            </NavLink>

            {/* API Keys */}
            <NavLink
              to="/keys"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-green/10 text-green border border-green/25 font-semibold shadow-sm'
                    : 'text-slate hover:bg-light-navy hover:text-white'
                }`
              }
            >
              <Key className="h-4 w-4 shrink-0" />
              <span>API Keys</span>
            </NavLink>
          </div>

          {/* Products: names only. The one you are on opens to show its pages. */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setListOpen(!listOpen)}
              className="flex w-full items-center justify-between px-3 text-slate hover:text-white"
              aria-expanded={listOpen}
              title="Show or hide products"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate/70">Products</span>
              {listOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>

            {listOpen &&
              products.map((product) => {
                const Icon = product.icon
                const live = serviceOpen(projects, product.slug)
                const open = expanded === product.slug
                const here = currentSlug === product.slug
                return (
                  <div key={product.slug} className="rounded-xl border border-navy-border/60 bg-navy/40 p-1.5 space-y-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setExpanded(product.slug)
                          if (location.pathname !== product.base) navigate(product.base)
                        }}
                        aria-expanded={open}
                        className={`flex min-w-0 flex-1 items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                          here ? 'text-white' : 'text-slate hover:text-white'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-green/10 border border-green/20 text-green">
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="truncate">{product.name}</span>
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${live ? 'bg-green/10 border-green/30 text-green' : 'bg-navy border-navy-border text-slate'}`}>
                          {live ? 'Live' : 'Off'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpanded(open ? null : product.slug)}
                        className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg text-slate hover:text-white"
                        aria-label={open ? `Hide ${product.name} pages` : `Show ${product.name} pages`}
                      >
                        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {open && (
                      <div className="ml-3 pl-3 border-l border-navy-border space-y-0.5 py-1">
                        {product.pages.map((page) => {
                          const PageIcon = page.icon
                          return (
                            <NavLink
                              key={page.path}
                              to={page.path}
                              end
                              className={({ isActive }) =>
                                `flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                                  isActive || page.aliases.includes(location.pathname)
                                    ? 'bg-green-tint text-green font-semibold border border-green/30'
                                    : 'text-slate hover:bg-light-navy hover:text-white'
                                }`
                              }
                            >
                              <PageIcon className="h-3.5 w-3.5" />
                              <span>{page.label}</span>
                            </NavLink>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>

          {/* Admin Section (If Authorized) */}
          {admin && (
            <div className="space-y-1">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate/70">
                Administration
              </p>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-green/10 text-green border border-green/25 font-semibold shadow-sm'
                      : 'text-slate hover:bg-light-navy hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-green" />
                  <span>Admin Console</span>
                </div>
              </NavLink>
            </div>
          )}

          {/* External Links */}
          <div className="pt-2 border-t border-navy-border/60 space-y-1">
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-medium text-slate hover:bg-light-navy hover:text-white transition-all"
            >
              <span className="flex items-center gap-2.5">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>karanparmar.in</span>
              </span>
              <span className="text-[10px] text-slate/60">Portfolio ↗</span>
            </a>
          </div>
        </div>

        {/* User Card / Footer */}
        <div className="border-t border-navy-border bg-lightest-navy p-4">
          {status === 'loading' ? (
            <div className="flex items-center gap-3 px-1 py-1">
              <div className="h-9 w-9 animate-pulse rounded-full border border-green/30 bg-light-navy" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-24 animate-pulse rounded bg-light-navy" />
                <div className="h-2 w-36 animate-pulse rounded bg-light-navy" />
              </div>
            </div>
          ) : user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-1">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-green/40 bg-green-tint font-bold text-sm text-green">
                  {letter}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {user.name || 'Studio User'}
                  </p>
                  <p className="truncate text-xs text-slate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-2 border-t border-navy-border/60">
                <a
                  href={sso.accountUrl()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-navy-border/80 bg-navy/60 px-2.5 py-1.5 text-xs font-medium text-slate hover:border-green/30 hover:bg-light-navy hover:text-white transition-all"
                >
                  <User className="h-3.5 w-3.5 text-green" />
                  <span>Account</span>
                </a>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-navy-border/80 bg-navy/60 px-2.5 py-1.5 text-xs font-medium text-slate hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                  <LogOut className="h-3.5 w-3.5 text-red-400" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen pt-16 md:pt-0">
        {/* Desktop Top Navbar Bar */}
        <header className="hidden md:flex h-16 items-center border-b border-navy-border bg-navy/80 px-8 sticky top-0 z-30">
          {/* Breadcrumb Path */}
          <nav className="flex items-center gap-2 text-sm text-slate">
            <Link to="/" className="hover:text-white font-medium">
              Studio
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.to + idx} className="flex items-center gap-2">
                <span className="text-slate/40">/</span>
                {idx === breadcrumbs.length - 1 ? (
                  <span className="font-semibold text-white">{crumb.label}</span>
                ) : (
                  <Link to={crumb.to} className="hover:text-white">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {/* Quick Stats & Actions */}
        </header>

        {/* Page Main Content Container */}
        <main className="flex-1 w-full px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
          <FadeIn key={location.pathname}>{pageBody(current, projects, children)}</FadeIn>
        </main>
      </div>
    </div>
  )
}
