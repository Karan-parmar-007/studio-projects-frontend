import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Key,
  AlertTriangle,
  RotateCcw,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CopyButton } from '@/components/CopyButton'
import { api, type ApiKey } from '@/lib/api'

export function KeyPage() {
  const [current, setCurrent] = useState<ApiKey | null | undefined>(undefined)
  const [secret, setSecret] = useState('')
  const [name, setName] = useState('My Studio Key')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  async function load() {
    setCurrent(await api<ApiKey | null>('/keys'))
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message))
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const created = await api<ApiKey>('/keys', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
      setSecret(created.secret || '')
      setShowCreateModal(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate API key')
    } finally {
      setBusy(false)
    }
  }

  async function handleRevoke() {
    if (!window.confirm('Are you sure you want to revoke this API key? Every app and script using this key will immediately stop working.')) {
      return
    }
    setError('')
    try {
      await api('/keys', { method: 'DELETE' })
      setSecret('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke API key')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-10 max-w-4xl">
        {/* Breadcrumb & Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs text-slate">
            <Link to="/dashboard" className="hover:text-green">Dashboard</Link>
            <span>/</span>
            <span className="text-green font-medium">API Keys</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-green/30 bg-green-tint px-3 py-1 font-mono text-xs text-green">
                <Key className="h-3.5 w-3.5 text-green" />
                <span>Single Credential</span>
              </div>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-lightest-slate sm:text-4xl">
                API Key Management
              </h1>
              <p className="mt-1 text-sm text-slate">
                One secret key grants authenticated access to all Studio products and models.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 font-mono text-xs font-semibold text-navy hover:bg-green/90 transition-all active:scale-95 shadow-md shadow-green/20"
            >
              <Key className="h-4 w-4" />
              <span>{current ? 'Rotate Key' : 'Generate Key'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-[#ff8b8b]/30 bg-[#ff8b8b]/10 p-4 text-xs text-[#ff8b8b]">
            {error}
          </div>
        )}

        {/* Newly Created Secret Banner */}
        {secret && (
          <div className="rounded-2xl border-2 border-green/40 bg-light-navy/90 p-6 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-lightest-slate">Your API Key is Ready</h3>
                <p className="text-xs text-slate mt-0.5">
                  Make sure to copy your key now. For security purposes, you will not be able to see it again after navigating away.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-green/30 bg-navy p-4 font-mono text-xs">
              <span className="text-green break-all select-all">{secret}</span>
              <CopyButton text={secret} label="Copy Key" className="ml-3 shrink-0" />
            </div>
          </div>
        )}

        {/* Active Key Card */}
        <section className="rounded-2xl border border-navy-border bg-light-navy/50 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-navy-border/60 pb-4">
            <div>
              <h2 className="text-lg font-bold text-lightest-slate">Active Secret Key</h2>
              <p className="text-xs text-slate">Currently active key bound to your account</p>
            </div>
            {current && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green/30 bg-green-tint px-2.5 py-0.5 font-mono text-[10px] text-green">
                <span className="h-1.5 w-1.5 rounded-full bg-green" />
                Active
              </span>
            )}
          </div>

          {current === undefined ? (
            <div className="py-6 text-center font-mono text-xs text-slate">Loading key…</div>
          ) : current ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-navy-border bg-navy/60 p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lightest-slate text-sm">{current.name}</span>
                    <span className="font-mono text-xs text-light-slate">
                      ({current.prefix}••••••••••••)
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-slate">
                    Created on {new Date(current.created_at).toLocaleDateString()}
                    {current.last_used_at
                      ? ` · Last active ${new Date(current.last_used_at).toLocaleDateString()}`
                      : ' · Never used'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-navy-border bg-light-navy px-3 py-1.5 font-mono text-xs text-light-slate hover:border-green/40 hover:text-green"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Rotate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRevoke()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-navy-border bg-light-navy px-3 py-1.5 font-mono text-xs text-[#ff8b8b] hover:bg-[#ff8b8b]/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Revoke</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-3">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-navy-border bg-navy text-slate">
                <Key className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-lightest-slate">No API key created yet</p>
              <p className="text-xs text-slate max-w-sm mx-auto">
                Generate your key to start using WhisperFlow on the desktop app, Android keyboard, or via REST API.
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-green px-4 py-2 font-mono text-xs font-semibold text-navy hover:bg-green/90"
              >
                <span>Create Key Now</span>
              </button>
            </div>
          )}
        </section>

        {/* Create / Rotate Key Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-navy-border bg-[#0a192f] p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-navy-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-green" />
                  <h3 className="text-base font-bold text-lightest-slate">
                    {current ? 'Rotate API Key' : 'Create API Key'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate hover:text-white"
                >
                  ✕
                </button>
              </div>

              {current && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Rotating your key will immediately invalidate your previous key. Any running apps must be updated.
                  </span>
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="font-mono text-xs text-light-slate">Key Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    placeholder="e.g. Workstation Laptop"
                    className="mt-1.5 w-full rounded-xl border border-navy-border bg-navy px-4 py-2.5 font-mono text-xs text-lightest-slate outline-none focus:border-green"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-lg px-4 py-2 font-mono text-xs text-slate hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-green px-5 py-2 font-mono text-xs font-semibold text-navy hover:bg-green/90 disabled:opacity-50"
                  >
                    {busy ? 'Generating…' : current ? 'Confirm & Rotate' : 'Create Key'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
