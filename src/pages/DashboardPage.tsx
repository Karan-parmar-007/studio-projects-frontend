import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Radio,
  Sparkles,
  ArrowRight,
  BookOpen,
  Play,
  FileText,
  Download,
  Key,
  Shield,
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useAuth } from '@/components/Auth'
import { api, type ApiKey, type Project } from '@/lib/api'
import { isAppAdmin } from '@/lib/sso'

export function DashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [apiKey, setApiKey] = useState<ApiKey | null | undefined>(undefined)
  const [error, setError] = useState('')

  const admin = isAppAdmin(user, 'studio')
  const firstName = user?.name ? user.name.split(' ')[0] : 'there'

  useEffect(() => {
    Promise.all([
      api<Project[]>('/projects').catch(() => [] as Project[]),
      api<ApiKey | null>('/keys').catch(() => null),
    ])
      .then(([projList, keyData]) => {
        setProjects(projList)
        setApiKey(keyData)
      })
      .catch((err: Error) => setError(err.message))
  }, [])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="rounded-2xl border border-navy-border/80 bg-gradient-to-r from-light-navy/80 via-light-navy/40 to-navy p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-green">Overview</span>
                <span className="text-slate">•</span>
                <span className="font-mono text-xs text-slate">Workspace</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-lightest-slate sm:text-4xl">
                Welcome back, {firstName}.
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate">
                Manage your self-hosted AI services, test models in the browser, and use your single API key across client apps.
              </p>
            </div>

            {/* Quick Action */}
            <div className="flex shrink-0 items-center gap-3">
              <Link
                to="/keys"
                className="inline-flex items-center gap-2 rounded-lg border border-navy-border bg-navy/80 px-4 py-2.5 font-mono text-xs font-medium text-light-slate transition-all hover:border-green/40 hover:text-green"
              >
                <Key className="h-3.5 w-3.5" />
                <span>{apiKey ? 'Manage Key' : 'Create API Key'}</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics / Key Status */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 pt-6 border-t border-navy-border/60">
            <div className="rounded-xl border border-navy-border/60 bg-navy/40 p-3.5">
              <p className="font-mono text-[11px] text-slate">Active Products</p>
              <p className="mt-1 text-xl font-bold text-lightest-slate">
                {projects ? projects.filter((p) => p.status === 'live').length : 1} Live
              </p>
            </div>
            <div className="rounded-xl border border-navy-border/60 bg-navy/40 p-3.5">
              <p className="font-mono text-[11px] text-slate">API Key Status</p>
              <div className="mt-1 flex items-center gap-2">
                {apiKey ? (
                  <>
                    <span className="flex h-2 w-2 rounded-full bg-green" />
                    <p className="font-mono text-xs text-green">Active ({apiKey.prefix}…)</p>
                  </>
                ) : (
                  <>
                    <span className="flex h-2 w-2 rounded-full bg-[#ff8b8b]" />
                    <p className="font-mono text-xs text-slate">No active key</p>
                  </>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-navy-border/60 bg-navy/40 p-3.5">
              <p className="font-mono text-[11px] text-slate">Hardware Engine</p>
              <p className="mt-1 text-xs font-mono text-light-slate">Local RTX 3060 + VPS</p>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-[#ff8b8b]">{error}</p>}

        {/* Products Section */}
        <div>
          <div className="flex items-center justify-between pb-3">
            <div>
              <h2 className="text-xl font-bold text-lightest-slate">Products & Services</h2>
              <p className="mt-0.5 text-xs text-slate">
                Each product includes an overview with architecture details, interactive playground, and API reference.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-6">
            {(projects ?? []).map((project) => (
              <article
                key={project.slug}
                className="rounded-2xl border border-navy-border bg-light-navy/60 p-6 transition-all duration-200 hover:border-navy-border/90 hover:bg-light-navy/80 hover:shadow-xl"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-green/30 bg-green-tint text-green">
                      {project.slug === 'whisperflow' ? (
                        <Radio className="h-6 w-6" />
                      ) : (
                        <Sparkles className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-xl font-bold text-lightest-slate">{project.name}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase font-medium border ${
                            project.status === 'live'
                              ? 'border-green/30 bg-green-tint text-green'
                              : 'border-navy-border bg-navy text-slate'
                          }`}
                        >
                          {project.status === 'live' ? 'Live' : 'Coming Soon'}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-light-slate">{project.tagline}</p>
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate">
                        {project.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3 Things Submenu Actions: Overview, Docs, Playground */}
                {project.slug === 'whisperflow' && project.status === 'live' && (
                  <div className="mt-6 pt-5 border-t border-navy-border/60">
                    <p className="font-mono text-[11px] text-light-slate mb-3">Explore product:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Link
                        to="/products/whisperflow"
                        className="group flex items-center justify-between rounded-xl border border-navy-border bg-navy/60 p-3.5 transition-all hover:border-green/40 hover:bg-navy"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-light-navy text-green group-hover:bg-green-tint">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-lightest-slate group-hover:text-green">
                              Project Details
                            </p>
                            <p className="font-mono text-[10px] text-slate">Overview & Specs</p>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate group-hover:text-green group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      <Link
                        to="/products/whisperflow/docs"
                        className="group flex items-center justify-between rounded-xl border border-navy-border bg-navy/60 p-3.5 transition-all hover:border-green/40 hover:bg-navy"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-light-navy text-green group-hover:bg-green-tint">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-lightest-slate group-hover:text-green">
                              API Reference
                            </p>
                            <p className="font-mono text-[10px] text-slate">Endpoints & Samples</p>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate group-hover:text-green group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      <Link
                        to="/products/whisperflow/playground"
                        className="group flex items-center justify-between rounded-xl border border-navy-border bg-navy/60 p-3.5 transition-all hover:border-green/40 hover:bg-navy"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-light-navy text-green group-hover:bg-green-tint">
                            <Play className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-lightest-slate group-hover:text-green">
                              Playground
                            </p>
                            <p className="font-mono text-[10px] text-slate">Interactive Testing</p>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate group-hover:text-green group-hover:translate-x-0.5 transition-transform" />
                      </Link>

                      <Link
                        to="/products/whisperflow/download"
                        className="group flex items-center justify-between rounded-xl border border-navy-border bg-navy/60 p-3.5 transition-all hover:border-green/40 hover:bg-navy"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-light-navy text-green group-hover:bg-green-tint">
                            <Download className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-lightest-slate group-hover:text-green">
                              Download
                            </p>
                            <p className="font-mono text-[10px] text-slate">Windows & Android</p>
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate group-hover:text-green group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                )}
              </article>
            ))}

            {projects === null && !error && (
              <div className="rounded-2xl border border-navy-border bg-light-navy/40 p-8 text-center">
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-green border-t-transparent" />
                <p className="mt-3 font-mono text-xs text-light-slate">Loading product catalog…</p>
              </div>
            )}
          </div>
        </div>

        {/* Administration Box if Admin */}
        {admin && (
          <div className="rounded-2xl border border-green/20 bg-green-tint/10 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-green/30 bg-green-tint text-green">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-lightest-slate">Model Links & Secret Settings</h3>
                  <p className="text-xs text-slate">
                    You have administrative access to configure PC and VPS model tunnels.
                  </p>
                </div>
              </div>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-lg bg-green px-4 py-2 font-mono text-xs font-semibold text-navy hover:bg-green/90"
              >
                <span>Manage Links</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
