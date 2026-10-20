import { useState, useEffect, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Layers,
  ChevronDown,
  ChevronRight,
  FileText,
  BookOpen,
  Play,
  Download,
  Key,
  Shield,
  ExternalLink,
  Menu,
  X,
  User,
  LogOut,
  Sparkles,
  Radio,
} from 'lucide-react'
import { useAuth } from '@/components/Auth'
import { isAppAdmin, sso } from '@/lib/sso'

const PORTFOLIO_URL = 'https://karanparmar.in'

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, status, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(true)
  const [whisperOpen, setWhisperOpen] = useState(true)

  const admin = isAppAdmin(user, 'studio')
  const letter = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase()

  const isWhisperActive =
    location.pathname.startsWith('/products/whisperflow') ||
    location.pathname.startsWith('/whisperflow-clone')

  // Auto-expand whisper dropdown if viewing a whisper route
  useEffect(() => {
    if (isWhisperActive) {
      setWhisperOpen(true)
      setProductsOpen(true)
    }
  }, [isWhisperActive])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <div className="flex min-h-screen bg-navy text-slate">
      {/* Mobile Header */}
      <header className="fixed top-0 inset-x-0 z-40 flex h-16 items-center justify-between border-b border-navy-border/80 bg-navy/95 px-4 backdrop-blur-md md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-mono text-base font-bold text-green tracking-tight">studio</span>
          <span className="rounded-full bg-green/10 px-2 py-0.5 font-mono text-[10px] text-green border border-green/20">
            platform
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-navy-border bg-light-navy/50 text-light-slate hover:text-green"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Backdrop for Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-navy-border/80 bg-[#071326] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Workspace & Brand */}
        <div className="flex h-16 items-center justify-between border-b border-navy-border/80 px-5">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-mono text-lg font-bold text-green tracking-tight group-hover:text-white transition-colors">
              studio
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-green/20 bg-green-tint px-2 py-0.5 font-mono text-[10px] font-medium text-green">
              <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
              v1.0
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded text-slate hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Menu List */}
          <div className="space-y-1">
            {/* Dashboard Link */}
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-mono tracking-wide transition-all ${
                  isActive
                    ? 'bg-green/10 text-green font-medium border border-green/20'
                    : 'text-light-slate hover:bg-light-navy/60 hover:text-white'
                }`
              }
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </NavLink>

            {/* Products Group / Dropdown */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setProductsOpen(!productsOpen)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-mono tracking-wide text-light-slate hover:bg-light-navy/40 hover:text-white transition-all"
              >
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4" />
                  <span className="font-semibold text-lightest-slate">Products</span>
                </div>
                {productsOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-slate" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-slate" />
                )}
              </button>

              {/* Products List */}
              {productsOpen && (
                <div className="mt-1 ml-3 border-l border-navy-border/60 pl-2 space-y-2">
                  {/* Product 1: WhisperFlow (Dropdown Accordion) */}
                  <div className="rounded-lg">
                    {/* WhisperFlow Product Header / Dropdown Toggle */}
                    <button
                      type="button"
                      onClick={() => setWhisperOpen(!whisperOpen)}
                      className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-mono transition-all ${
                        isWhisperActive
                          ? 'bg-light-navy/80 text-lightest-slate font-medium'
                          : 'text-light-slate hover:bg-light-navy/40 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Radio className="h-3.5 w-3.5 text-green" />
                        <span className="font-semibold text-lightest-slate">WhisperFlow</span>
                        <span className="rounded bg-green/10 px-1.5 py-0.2 font-mono text-[9px] text-green">
                          live
                        </span>
                      </div>
                      {whisperOpen ? (
                        <ChevronDown className="h-3.5 w-3.5 text-slate" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-slate" />
                      )}
                    </button>

                    {/* WhisperFlow Sub-items: Overview, Docs, Playground, Download */}
                    {whisperOpen && (
                      <div className="mt-1 ml-3 border-l border-green/20 pl-2 space-y-1">
                        <NavLink
                          to="/products/whisperflow"
                          end
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-mono transition-all ${
                              isActive || location.pathname === '/whisperflow-clone'
                                ? 'bg-green-tint text-green font-medium border border-green/30'
                                : 'text-slate hover:bg-light-navy/50 hover:text-light-slate'
                            }`
                          }
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Overview</span>
                        </NavLink>

                        <NavLink
                          to="/products/whisperflow/docs"
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-mono transition-all ${
                              isActive || location.pathname === '/whisperflow-clone/docs'
                                ? 'bg-green-tint text-green font-medium border border-green/30'
                                : 'text-slate hover:bg-light-navy/50 hover:text-light-slate'
                            }`
                          }
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Docs & API</span>
                        </NavLink>

                        <NavLink
                          to="/products/whisperflow/playground"
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-mono transition-all ${
                              isActive || location.pathname === '/whisperflow-clone/playground'
                                ? 'bg-green-tint text-green font-medium border border-green/30'
                                : 'text-slate hover:bg-light-navy/50 hover:text-light-slate'
                            }`
                          }
                        >
                          <Play className="h-3.5 w-3.5" />
                          <span>Playground</span>
                        </NavLink>

                        <NavLink
                          to="/products/whisperflow/download"
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-mono transition-all ${
                              isActive || location.pathname === '/whisperflow-clone/download'
                                ? 'bg-green-tint text-green font-medium border border-green/30'
                                : 'text-slate hover:bg-light-navy/50 hover:text-light-slate'
                            }`
                          }
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </NavLink>
                      </div>
                    )}
                  </div>

                  {/* Product 2: Chatbot Teaser */}
                  <div className="flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-mono text-slate/50">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5" />
                      Chatbot
                    </span>
                    <span className="text-[10px]">soon</span>
                  </div>
                </div>
              )}
            </div>

            {/* API Keys */}
            <NavLink
              to="/keys"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-mono tracking-wide transition-all ${
                  isActive
                    ? 'bg-green/10 text-green font-medium border border-green/20'
                    : 'text-light-slate hover:bg-light-navy/60 hover:text-white'
                }`
              }
            >
              <Key className="h-4 w-4" />
              <span>API Keys</span>
            </NavLink>

            {/* Admin (Only if Admin) */}
            {admin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-mono tracking-wide transition-all ${
                    isActive
                      ? 'bg-green/10 text-green font-medium border border-green/20'
                      : 'text-light-slate hover:bg-light-navy/60 hover:text-white'
                  }`
                }
              >
                <Shield className="h-4 w-4 text-green" />
                <div className="flex items-center justify-between flex-1">
                  <span>Admin</span>
                  <span className="rounded bg-navy-border px-1.5 py-0.5 text-[9px] text-green">
                    secrets
                  </span>
                </div>
              </NavLink>
            )}
          </div>

          {/* External Links */}
          <div className="pt-4 border-t border-navy-border/60">
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-mono text-slate hover:bg-light-navy/40 hover:text-light-slate transition-all"
            >
              <span className="flex items-center gap-2.5">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>karanparmar.in</span>
              </span>
              <span className="text-[10px] text-slate/70">portfolio ↗</span>
            </a>
          </div>
        </div>

        {/* User Card / Footer */}
        <div className="border-t border-navy-border/80 bg-[#050e1b] p-3">
          {status === 'loading' ? (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="h-8 w-8 animate-pulse rounded-full border border-green/30 bg-light-navy" />
              <div className="space-y-1">
                <div className="h-3 w-24 animate-pulse rounded bg-light-navy" />
                <div className="h-2 w-32 animate-pulse rounded bg-light-navy" />
              </div>
            </div>
          ) : user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-2 py-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-green/40 bg-green-tint font-mono text-xs font-bold text-green">
                  {letter}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-lightest-slate">
                    {user.name || 'User'}
                  </p>
                  <p className="truncate font-mono text-[10px] text-slate">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 pt-1 border-t border-navy-border/40">
                <a
                  href={sso.accountUrl()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-mono text-slate hover:bg-light-navy hover:text-green transition-all"
                >
                  <User className="h-3 w-3" />
                  <span>Account</span>
                </a>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-mono text-slate hover:bg-light-navy hover:text-[#ff8b8b] transition-all"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 min-h-screen pt-16 md:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">{children}</div>
      </main>
    </div>
  )
}
