import { useEffect, useState, type FormEvent } from 'react'
import {
  Key,
  AlertTriangle,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Shield,
  Terminal,
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
  const [showRevokeModal, setShowRevokeModal] = useState(false)

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
    setError('')
    setBusy(true)
    try {
      await api('/keys', { method: 'DELETE' })
      setSecret('')
      setShowRevokeModal(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke API key')
    } finally {
      setBusy(false)
    }
  }

  const sampleCurl = `curl -X POST "https://studio.karanparmar.in/api/studio/v1/whisperflow/format" \\
  -H "Authorization: Bearer ${secret || (current ? current.prefix + '••••••••' : 'sk-studio_YOUR_KEY')}" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "point 1 server stays at home point 2 keyboard is for android"}'`

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-navy-border pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-green/30 bg-green-tint px-3 py-1 text-xs font-semibold text-green">
              <Key className="h-3.5 w-3.5 text-green" />
              <span>Unified Studio Credential</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              API Key Management
            </h1>
            <p className="text-sm text-slate">
              One secret API key powers all Studio products across desktop, Android, and custom scripts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 text-xs font-semibold text-ink hover:bg-green/90 transition-all shadow-md shadow-green/20 active:scale-95 shrink-0"
          >
            <Key className="h-4 w-4" />
            <span>{current ? 'Rotate API Key' : 'Generate API Key'}</span>
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Newly Created Secret Banner */}
        {secret && (
          <div className="rounded-3xl border-2 border-green/50 bg-gradient-to-b from-light-navy via-light-navy/90 to-navy p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green/10 border border-green/30 text-green">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Your New API Key is Ready</h3>
                <p className="text-xs text-slate leading-relaxed">
                  Please copy your secret key now. For your security, you will not be able to view this full key again after leaving this page.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-green/30 bg-navy p-4 font-mono text-xs">
              <span className="text-green font-semibold break-all select-all">{secret}</span>
              <CopyButton text={secret} label="Copy Secret Key" className="shrink-0" />
            </div>
          </div>
        )}

        {/* Active Key Card */}
        <section className="rounded-3xl border border-navy-border bg-light-navy/60 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-navy-border/60 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Active Secret Key</h2>
              <p className="text-xs text-slate mt-0.5">Current credential bound to your SSO user account</p>
            </div>
            {current && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green/30 bg-green-tint px-3 py-1 text-xs font-semibold text-green">
                <span className="h-2 w-2 rounded-full bg-green" />
                <span>Active</span>
              </span>
            )}
          </div>

          {current === undefined ? (
            <div className="py-10 text-center text-sm text-slate">
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-green border-t-transparent mb-2" />
              <p>Loading API key status…</p>
            </div>
          ) : current ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-navy-border bg-navy/60 p-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white text-base">{current.name}</span>
                    <span className="font-mono text-xs font-semibold text-green rounded-md bg-green-tint border border-green/20 px-2 py-0.5">
                      {current.prefix}••••••••••••
                    </span>
                  </div>
                  <p className="text-xs text-slate">
                    Created on {new Date(current.created_at).toLocaleDateString()}
                    {current.last_used_at
                      ? ` · Last active ${new Date(current.last_used_at).toLocaleDateString()}`
                      : ' · Not used yet'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-navy-border bg-light-navy px-3.5 py-2 text-xs font-semibold text-white hover:border-green/40 hover:text-green transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Rotate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRevokeModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Revoke</span>
                  </button>
                </div>
              </div>

              {/* Quick Integration Example */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-green" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Quick API Test
                    </span>
                  </div>
                  <CopyButton text={sampleCurl} label="Copy cURL" />
                </div>
                <pre className="overflow-x-auto rounded-2xl border border-navy-border bg-navy p-5 font-mono text-xs text-light-slate leading-relaxed">
                  {sampleCurl}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-navy-border bg-navy text-slate">
                <Key className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No API Key Generated Yet</h3>
                <p className="text-xs text-slate max-w-sm mx-auto leading-relaxed">
                  Generate your single Studio key to start using WhisperFlow on the desktop tray app, Android floating bubble, or your custom Python/cURL automations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-green px-6 py-3 text-xs font-semibold text-ink hover:bg-green/90 transition-all shadow-md active:scale-95"
              >
                <Key className="h-4 w-4" />
                <span>Create Key Now</span>
              </button>
            </div>
          )}
        </section>

        {/* Security & Access Info */}
        <section className="rounded-3xl border border-navy-border bg-light-navy/40 p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2.5">
            <Shield className="h-5 w-5 text-green" />
            <h3 className="font-bold text-white text-base">Key Security & Scope</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate">
            Studio API keys use high-entropy cryptographic generation with SHA-256 hashing in the database. Rotating a key instantly revokes the previous token across all connected applications.
          </p>
        </section>

        {/* Create / Rotate Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-navy-border bg-[#0a1220] p-6 sm:p-7 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-navy-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green/10 text-green">
                    <Key className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-bold text-white">
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
                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                  <p className="leading-relaxed">
                    Rotating your API key will immediately invalidate your active key. Any running desktop apps, Android bubbles, or scripts must be updated with the new key.
                  </p>
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white">Key Label / Identifier</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    placeholder="e.g. Workstation Laptop"
                    className="w-full rounded-xl border border-navy-border bg-navy px-4 py-2.5 text-xs text-white outline-none focus:border-green"
                  />
                  <p className="text-[11px] text-slate">A friendly name to help you identify this key</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-xl px-4 py-2 text-xs font-medium text-slate hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-green px-5 py-2.5 text-xs font-semibold text-ink hover:bg-green/90 transition-all disabled:opacity-50"
                  >
                    {busy ? 'Generating…' : current ? 'Confirm & Rotate Key' : 'Generate Key'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Revoke Confirmation Modal */}
        {showRevokeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-red-500/40 bg-[#0a1220] p-6 sm:p-7 shadow-2xl space-y-5">
              <div className="flex items-center gap-3 text-red-400">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <h3 className="text-lg font-bold text-white">Revoke Studio API Key?</h3>
              </div>

              <p className="text-xs leading-relaxed text-slate">
                Are you sure you want to revoke this API key? All applications and automated scripts using this key will immediately stop working until a new key is created and configured.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRevokeModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-slate hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleRevoke()}
                  disabled={busy}
                  className="rounded-xl bg-red-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {busy ? 'Revoking…' : 'Yes, Revoke Key'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
