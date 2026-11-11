import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react'
import { api } from '@/lib/api'
import {
  STAGE_LABELS,
  building,
  formatBytes,
  postFileWithProgress,
  stillFinishing,
  type Access,
  type RagSource,
} from '@/lib/rag'

// Admin sections for the two document products: the site assistant ("chatbot") and
// Ask a Document ("rag"). AdminPage renders these for /admin/chatbot and /admin/rag.

type SettingsSlug = 'chatbot' | 'rag'
type Values = Record<string, unknown> & { access?: Access; roles?: string[]; limits?: Record<string, number> }
type NumberField = { key: string; label: string; min: number; max: number; hint?: string }

const BOOLEANS: Record<SettingsSlug, { key: string; label: string; hint: string }[]> = {
  chatbot: [
    { key: 'on_studio', label: 'Show on Studio', hint: 'The bubble on every Studio page.' },
    { key: 'on_portfolio', label: 'Show on karanparmar.in', hint: 'The bubble on the portfolio.' },
    { key: 'tools_enabled', label: 'Tools', hint: 'Signed-in people can check Maps Scraper quota and prepare a search.' },
  ],
  rag: [{ key: 'uploads_enabled', label: 'Uploads', hint: 'Signed-in people can upload one document of their own.' }],
}

const NUMBERS: Record<SettingsSlug, NumberField[]> = {
  chatbot: [],
  rag: [
    { key: 'upload_max_mb', label: 'Upload size (MB)', min: 1, max: 5 },
    { key: 'upload_ttl_minutes', label: 'Kept for (minutes)', min: 5, max: 60 },
    { key: 'upload_max_pages', label: 'Max pages', min: 1, max: 300 },
  ],
}

const LIMITS: NumberField[] = [
  { key: 'daily_anonymous', label: 'Questions a day, signed out', min: 0, max: 10000, hint: 'Per IP, UTC day. 0 blocks.' },
  { key: 'daily_signed_in', label: 'Questions a day, signed in', min: 0, max: 10000, hint: 'Per account, UTC day.' },
  { key: 'max_waiting_anonymous', label: 'Line limit, signed out', min: 0, max: 20, hint: 'Refuse new questions past this many waiting.' },
  { key: 'max_waiting_signed_in', label: 'Line limit, signed in', min: 0, max: 20, hint: 'Same, for signed-in people.' },
]

const ACCESS: { value: Access; label: string; hint: string }[] = [
  { value: 'everyone', label: 'Everyone', hint: 'Signed out too.' },
  { value: 'signed_in', label: 'Signed in', hint: 'Any account.' },
  { value: 'roles', label: 'Roles', hint: 'Only the roles below. Admins always pass.' },
]

const field =
  'w-full rounded-xl border border-navy-border bg-navy px-3 py-2 text-xs text-white outline-none focus:border-green disabled:opacity-50'
const card = 'rounded-3xl border border-navy-border bg-light-navy/60 p-6 sm:p-7'

function errorText(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

function Alert({ kind, text }: { kind: 'error' | 'success'; text: string }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl border p-3.5 text-xs ${
        kind === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-green/30 bg-green-tint font-medium text-green'
      }`}
    >
      {kind === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
      <span>{text}</span>
    </div>
  )
}

/** Who may use a product, where, and how much. GET/PUT /admin/services/{slug}/settings. */
export function ServiceSettingsForm({ slug, onSaved }: { slug: SettingsSlug; onSaved?: () => void }) {
  const [values, setValues] = useState<Values | null>(null)
  const [rolesText, setRolesText] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  useEffect(() => {
    let live = true
    api<Values>(`/admin/services/${slug}/settings`)
      .then((next) => {
        if (!live) return
        setValues(next)
        setRolesText((next.roles ?? []).join(', '))
      })
      .catch((err) => live && setMessage({ kind: 'error', text: errorText(err, 'Could not load the settings') }))
    return () => {
      live = false
    }
  }, [slug])

  function set(key: string, value: unknown) {
    setValues((current) => (current ? { ...current, [key]: value } : current))
  }

  function setLimit(key: string, value: number) {
    setValues((current) => (current ? { ...current, limits: { ...(current.limits ?? {}), [key]: value } } : current))
  }

  async function save() {
    if (!values) return
    setSaving(true)
    setMessage(null)
    const roles = rolesText
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean)
    try {
      const saved = await api<Values>(`/admin/services/${slug}/settings`, {
        method: 'PUT',
        body: JSON.stringify({ ...values, roles }),
      })
      setValues(saved)
      setRolesText((saved.roles ?? []).join(', '))
      setMessage({ kind: 'success', text: 'Settings saved. They apply to the next question.' })
      onSaved?.()
    } catch (err) {
      setMessage({ kind: 'error', text: errorText(err, 'Could not save the settings') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
      className={`${card} space-y-6`}
    >
      <div>
        <h3 className="text-base font-bold text-white">Who can use it</h3>
        <p className="mt-0.5 text-xs text-slate">Access, where it shows, and daily limits.</p>
      </div>

      {!values ? (
        message ? (
          <Alert kind={message.kind} text={message.text} />
        ) : (
          <p className="flex items-center gap-2 text-xs text-slate">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading settings…
          </p>
        )
      ) : (
        <>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-xs font-semibold text-white">Access</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {ACCESS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-2xl border p-3 text-xs ${
                    values.access === option.value ? 'border-green/50 bg-green-tint' : 'border-navy-border bg-navy/40'
                  }`}
                >
                  <input
                    type="radio"
                    name={`${slug}-access`}
                    value={option.value}
                    checked={values.access === option.value}
                    onChange={() => set('access', option.value)}
                    className="mt-0.5 accent-green"
                  />
                  <span>
                    <span className="block font-semibold text-white">{option.label}</span>
                    <span className="text-slate">{option.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <label htmlFor={`${slug}-roles`} className="text-xs font-semibold text-white">
              Roles
            </label>
            <input
              id={`${slug}-roles`}
              value={rolesText}
              onChange={(event) => setRolesText(event.target.value)}
              disabled={values.access !== 'roles'}
              placeholder="user, studio:beta"
              className={`${field} font-mono`}
            />
            <p className="text-[11px] text-slate">
              Comma-separated. A global role like "user", or an app role like "studio:beta". Used when access is Roles.
            </p>
          </div>

          {BOOLEANS[slug].length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {BOOLEANS[slug].map((item) => (
                <label key={item.key} className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-navy-border bg-navy/40 p-3 text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(values[item.key])}
                    onChange={(event) => set(item.key, event.target.checked)}
                    className="mt-0.5 accent-green"
                  />
                  <span>
                    <span className="block font-semibold text-white">{item.label}</span>
                    <span className="text-slate">{item.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {NUMBERS[slug].length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {NUMBERS[slug].map((item) => (
                <NumberInput
                  key={item.key}
                  id={`${slug}-${item.key}`}
                  item={item}
                  value={Number(values[item.key] ?? 0)}
                  onChange={(value) => set(item.key, value)}
                />
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {LIMITS.map((item) => (
              <NumberInput
                key={item.key}
                id={`${slug}-limit-${item.key}`}
                item={item}
                value={Number(values.limits?.[item.key] ?? 0)}
                onChange={(value) => setLimit(item.key, value)}
              />
            ))}
          </div>

          {message && <Alert kind={message.kind} text={message.text} />}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-green/90 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </>
      )}
    </form>
  )
}

function NumberInput({ id, item, value, onChange }: { id: string; item: NumberField; value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-semibold text-white">
        {item.label}
      </label>
      <input
        id={id}
        type="number"
        min={item.min}
        max={item.max}
        step={1}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(event.target.value === '' ? 0 : Math.trunc(Number(event.target.value)))}
        className={`${field} font-mono`}
      />
      <p className="text-[11px] text-slate">
        {item.min}–{item.max}
        {item.hint ? ` · ${item.hint}` : ''}
      </p>
    </div>
  )
}

function StatusBadge({ source }: { source: RagSource }) {
  const tone =
    source.status === 'failed'
      ? 'border-red-500/30 bg-red-500/10 text-red-500'
      : source.status === 'ready'
        ? 'border-green/30 bg-green-tint text-green'
        : 'border-navy-border bg-navy text-slate'
  return <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${tone}`}>{source.status}</span>
}

/** Versions of a corpus: which one is live, and how far a new one has got. */
function VersionList({
  versions,
  onRetry,
  onDelete,
  busyId,
  deleteAny = false,
  empty = 'No versions yet.',
  deleteNote = '',
}: {
  versions: RagSource[]
  onRetry?: (id: string) => void
  onDelete?: (id: string) => void
  busyId: string | null
  /** Books: live ones and ones still being built can be deleted too. */
  deleteAny?: boolean
  empty?: string
  deleteNote?: string
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  if (!versions.length) {
    return <div className="rounded-2xl border border-navy-border bg-navy/40 p-6 text-center text-xs text-slate">{empty}</div>
  }
  return (
    <ul className="space-y-3">
      {versions.map((version) => {
        const working = building(version) || stillFinishing(version)
        const facts = [
          version.size_bytes ? formatBytes(version.size_bytes) : '',
          version.pages != null ? `${version.pages} pages` : '',
          version.chunks != null ? `${version.chunks} passages` : '',
          version.figures != null ? `${version.figures} figures` : '',
          version.created_at ? `added ${new Date(version.created_at).toLocaleString()}` : '',
        ].filter(Boolean)
        return (
          <li key={version.id} className="space-y-3 rounded-2xl border border-navy-border bg-navy/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-green" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {version.title || version.filename || 'Portfolio only'}
                    {version.filename && version.filename !== version.title && (
                      <span className="ml-2 font-mono text-[11px] font-normal text-slate">{version.filename}</span>
                    )}
                  </p>
                  {facts.length > 0 && <p className="text-[11px] text-slate">{facts.join(' · ')}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {version.active && (
                  <span className="rounded-full border border-green/40 bg-green px-2.5 py-0.5 text-[11px] font-semibold text-ink">Live</span>
                )}
                <StatusBadge source={version} />
              </div>
            </div>

            {working && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-white">{STAGE_LABELS[version.stage] ?? version.stage}…</span>
                  <span className="font-mono text-slate">{version.progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-navy">
                  <div className="h-full rounded-full bg-green transition-[width] duration-500" style={{ width: `${Math.max(2, version.progress)}%` }} />
                </div>
              </div>
            )}

            {version.error && (
              <p className="flex items-start gap-2 text-xs text-red-500">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {version.error}
              </p>
            )}

            {(onRetry || onDelete) && (deleteAny || version.status === 'failed' || !version.active) && (
              <div className="flex flex-wrap justify-end gap-2 border-t border-navy-border/60 pt-3">
                {onRetry && version.status === 'failed' && (
                  <button
                    type="button"
                    disabled={busyId === version.id}
                    onClick={() => onRetry(version.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-navy-border bg-light-navy px-3 py-1.5 text-xs font-semibold text-white hover:border-green/40 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-green" />
                    Retry
                  </button>
                )}
                {onDelete &&
                  (deleteAny || !version.active) &&
                  (confirmId === version.id ? (
                    <>
                      {deleteNote && <span className="mr-auto self-center text-[11px] text-red-500">{deleteNote}</span>}
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="rounded-lg border border-navy-border bg-navy px-3 py-1.5 text-xs text-slate hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={busyId === version.id}
                        onClick={() => {
                          setConfirmId(null)
                          onDelete(version.id)
                        }}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-navy hover:bg-red-600 disabled:opacity-50"
                      >
                        Yes, delete
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === version.id || (!deleteAny && building(version))}
                      onClick={() => setConfirmId(version.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  ))}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Pick a file and upload it with a progress bar (XMLHttpRequest). */
function FileUpload({
  label,
  hint,
  accept,
  path,
  disabled,
  onDone,
  withTitle = false,
  doneText = 'Building the new version now.',
}: {
  label: string
  hint: string
  accept: string
  path: string
  disabled?: boolean
  onDone: () => void
  /** Ask for a display title (sent as the form field "title"). */
  withTitle?: boolean
  doneText?: string
}) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [percent, setPercent] = useState<number | null>(null)
  const [message, setMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function send() {
    if (!file) return
    setMessage(null)
    setPercent(0)
    try {
      await postFileWithProgress<RagSource>(path, file, setPercent, withTitle ? { title: title.trim() } : {})
      setMessage({ kind: 'success', text: `Uploaded ${file.name}. ${doneText}` })
      setFile(null)
      setTitle('')
      if (inputRef.current) inputRef.current.value = ''
      onDone()
    } catch (err) {
      setMessage({ kind: 'error', text: errorText(err, 'The upload failed') })
    } finally {
      setPercent(null)
    }
  }

  const sending = percent !== null
  return (
    <div className="space-y-3">
      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-navy-border bg-navy/40 p-5 text-center transition-all hover:border-green/50 ${
          disabled || sending ? 'pointer-events-none opacity-60' : ''
        }`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          const dropped = event.dataTransfer.files?.[0]
          if (dropped) setFile(dropped)
        }}
      >
        <Upload className="mb-1.5 h-6 w-6 text-green" />
        <span className="text-xs font-semibold text-white">{file ? file.name : label}</span>
        <span className="mt-0.5 text-[11px] text-slate">{file ? formatBytes(file.size) : hint}</span>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled || sending}
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </label>

      {sending && (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-white">{percent < 100 ? 'Uploading…' : 'Saving on the server…'}</span>
            <span className="font-mono text-slate">{percent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-navy">
            <div className="h-full rounded-full bg-green" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      {message && <Alert kind={message.kind} text={message.text} />}

      {file && !sending && withTitle && (
        <input
          type="text"
          value={title}
          maxLength={300}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={`Title shown to users (default: ${file.name.replace(/\.[^.]+$/, '')})`}
          className={field}
        />
      )}

      {file && !sending && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setFile(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
            className="rounded-xl border border-navy-border bg-navy px-3.5 py-1.5 text-xs text-slate hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void send()}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 rounded-xl bg-green px-4 py-1.5 text-xs font-semibold text-ink shadow-sm hover:bg-green/90 disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload & build
          </button>
        </div>
      )}
    </div>
  )
}

type AdminView = {
  settings: Values
  enabled: boolean
  /** Chatbot knowledge versions. */
  versions?: RagSource[]
  /** Ask a Document: every book (any status) and every user upload present now. */
  books?: RagSource[]
  uploads?: RagSource[]
  max_books?: number
}

/** Load an admin view and poll it every 3 s while a version is being built. */
function useAdminView(path: string) {
  const [view, setView] = useState<AdminView | null>(null)
  const [error, setError] = useState('')

  const reload = useCallback(() => {
    return api<AdminView>(path)
      .then((next) => {
        setView(next)
        setError('')
      })
      .catch((err) => setError(errorText(err, 'Could not load this product')))
  }, [path])

  useEffect(() => {
    void reload()
  }, [reload])

  const all = [...(view?.versions ?? []), ...(view?.books ?? []), ...(view?.uploads ?? [])]
  const working = all.some((version) => building(version) || stillFinishing(version))
  useEffect(() => {
    if (!working) return
    const timer = window.setInterval(() => void reload(), 3000)
    return () => window.clearInterval(timer)
  }, [working, reload])

  // The server refuses a new version while one is still being made (not live, not failed).
  const blocked = (view?.versions ?? []).some((version) => !version.active && version.status !== 'failed')

  return { view, error, reload, blocked }
}

function SectionHeader({ title, body, onRefresh }: { title: string; body: string; onRefresh: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-navy-border pb-4">
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-xs text-slate">{body}</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center gap-1.5 rounded-xl border border-navy-border bg-light-navy px-3.5 py-2 text-xs font-semibold text-white transition-all hover:border-green/40 hover:text-green"
      >
        <RefreshCw className="h-3.5 w-3.5 text-green" />
        Refresh
      </button>
    </div>
  )
}

export function ChatbotAdminSection() {
  const { view, error, reload, blocked } = useAdminView('/chatbot/admin')
  const [syncing, setSyncing] = useState(false)
  const [note, setNote] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  async function sync() {
    setSyncing(true)
    setNote(null)
    try {
      await api<RagSource>('/chatbot/admin/sync', { method: 'POST' })
      setNote({ kind: 'success', text: 'Rebuilding from the current file and fresh portfolio data.' })
      await reload()
    } catch (err) {
      setNote({ kind: 'error', text: errorText(err, 'Could not start the rebuild') })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Assistant knowledge"
        body="What the assistant knows: Karan's profile PDF plus the portfolio and the Studio catalog. A new version is built beside the live one and swapped in when ready."
        onRefresh={() => void reload()}
      />
      {error && <Alert kind="error" text={error} />}

      <ServiceSettingsForm slug="chatbot" />

      <div className={`${card} space-y-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Profile document</h3>
            <p className="mt-0.5 text-xs text-slate">Upload a new PDF (or DOCX/Markdown), or rebuild after editing the portfolio.</p>
          </div>
          <button
            type="button"
            onClick={() => void sync()}
            disabled={syncing || blocked}
            className="inline-flex items-center gap-1.5 rounded-xl border border-navy-border bg-light-navy px-3.5 py-2 text-xs font-semibold text-white hover:border-green/40 disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-green" /> : <RefreshCw className="h-3.5 w-3.5 text-green" />}
            Sync portfolio data
          </button>
        </div>
        {note && <Alert kind={note.kind} text={note.text} />}
        <FileUpload
          label="Select the profile PDF"
          hint="Up to 50 MB · click or drag a file here"
          accept=".pdf,.docx,.md,.markdown,.txt"
          path="/chatbot/admin/knowledge"
          disabled={blocked}
          onDone={() => void reload()}
        />
        {blocked && <p className="text-[11px] text-slate">A version is being built. Uploads and syncs wait until it finishes.</p>}
      </div>

      <div className={`${card} space-y-4`}>
        <h3 className="text-base font-bold text-white">Versions</h3>
        {view ? <VersionList versions={view.versions ?? []} busyId={null} /> : !error && <p className="text-xs text-slate">Loading…</p>}
      </div>
    </div>
  )
}

function UploadsTable({
  uploads,
  busyId,
  onDelete,
}: {
  uploads: RagSource[]
  busyId: string | null
  onDelete: (id: string) => void
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  if (!uploads.length) {
    return <div className="rounded-2xl border border-navy-border bg-navy/40 p-6 text-center text-xs text-slate">No user documents right now.</div>
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-navy-border">
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead className="bg-navy/60 text-[11px] uppercase tracking-wider text-slate">
          <tr>
            <th className="px-3 py-2 font-semibold">Uploaded by</th>
            <th className="px-3 py-2 font-semibold">Document</th>
            <th className="px-3 py-2 font-semibold">Status</th>
            <th className="px-3 py-2 font-semibold">Deleted at</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-border/60">
          {uploads.map((item) => (
            <tr key={item.id} className="align-top">
              <td className="px-3 py-2.5">
                <p className="font-semibold text-white">{item.owner_label || 'Unknown'}</p>
                <p className="font-mono text-[10px] text-slate">{item.owner_id}</p>
              </td>
              <td className="px-3 py-2.5">
                <p className="max-w-[220px] truncate text-white" title={item.filename}>
                  {item.filename}
                </p>
                <p className="text-[11px] text-slate">
                  {[
                    formatBytes(item.size_bytes),
                    item.pages ? `${item.pages} pages` : '',
                    item.figures ? `${item.figures} figures` : '',
                    item.created_at ? `added ${new Date(item.created_at).toLocaleTimeString()}` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </td>
              <td className="px-3 py-2.5">
                <StatusBadge source={item} />
                {building(item) && (
                  <p className="mt-1 text-[11px] text-slate">
                    {STAGE_LABELS[item.stage] ?? item.stage} {item.progress}%
                  </p>
                )}
                {item.error && <p className="mt-1 max-w-[200px] text-[11px] text-red-500">{item.error}</p>}
              </td>
              <td className="px-3 py-2.5 text-slate">
                {item.expires_at ? new Date(item.expires_at).toLocaleTimeString() : 'after processing + 1 h'}
              </td>
              <td className="px-3 py-2.5 text-right">
                {confirmId === item.id ? (
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="rounded-lg border border-navy-border bg-navy px-2.5 py-1 text-[11px] text-slate hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => {
                        setConfirmId(null)
                        onDelete(item.id)
                      }}
                      className="rounded-lg bg-red-500 px-2.5 py-1 text-[11px] font-semibold text-navy hover:bg-red-600 disabled:opacity-50"
                    >
                      Delete all
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => setConfirmId(item.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {busyId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function RagAdminSection() {
  const { view, error, reload } = useAdminView('/rag/admin')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [note, setNote] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  async function act(id: string, kind: 'retry' | 'delete-book' | 'delete-upload') {
    setBusyId(id)
    setNote(null)
    try {
      if (kind === 'retry') await api<RagSource>(`/rag/admin/books/${id}/retry`, { method: 'POST' })
      else if (kind === 'delete-book') await api<void>(`/rag/admin/books/${id}`, { method: 'DELETE' })
      else await api<void>(`/rag/admin/uploads/${id}`, { method: 'DELETE' })
      if (kind !== 'retry') setNote({ kind: 'success', text: 'Deleted: its file, images, vectors and cached answers are gone.' })
      await reload()
    } catch (err) {
      setNote({ kind: 'error', text: errorText(err, kind === 'retry' ? 'Could not retry' : 'Could not delete') })
    } finally {
      setBusyId(null)
    }
  }

  const books = view?.books ?? []
  const uploads = view?.uploads ?? []
  const maxBooks = view?.max_books ?? 5
  const full = books.length >= maxBooks

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Ask a Document"
        body="The books everyone can ask, the documents people uploaded, and the limits for both."
        onRefresh={() => void reload()}
      />
      {error && <Alert kind="error" text={error} />}
      {note && <Alert kind={note.kind} text={note.text} />}

      <ServiceSettingsForm slug="rag" />

      <div className={`${card} space-y-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Books</h3>
            <p className="mt-0.5 text-xs text-slate">
              Each book goes live on its own when it is ready. Users can ask one book or all of them. Big books take a while.
            </p>
          </div>
          <span className="rounded-full border border-navy-border bg-navy px-3 py-1 text-xs text-slate">
            {books.length} of {maxBooks} books
          </span>
        </div>
        <FileUpload
          label={full ? 'The shelf is full: delete a book first' : 'Add a book'}
          hint="PDF, DOCX, PPTX, Markdown, HTML or text · can be hundreds of MB"
          accept=".pdf,.docx,.pptx,.txt,.md,.markdown,.html,.htm"
          path="/rag/admin/books"
          disabled={full}
          withTitle
          doneText="It goes live when processing finishes."
          onDone={() => void reload()}
        />
        {view ? (
          <VersionList
            versions={books}
            busyId={busyId}
            deleteAny
            empty="No books yet. Add one above."
            deleteNote="Deletes the book's file, images, vectors and cached answers."
            onRetry={(id) => void act(id, 'retry')}
            onDelete={(id) => void act(id, 'delete-book')}
          />
        ) : (
          !error && <p className="text-xs text-slate">Loading…</p>
        )}
      </div>

      <div className={`${card} space-y-4`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">People&apos;s documents</h3>
            <p className="mt-0.5 text-xs text-slate">
              Uploads present right now. Each is deleted automatically an hour after processing; delete one here to remove it
              at once (file, images, vectors).
            </p>
          </div>
          <span className="rounded-full border border-navy-border bg-navy px-3 py-1 text-xs text-slate">
            {uploads.length} present
          </span>
        </div>
        {view ? (
          <UploadsTable uploads={uploads} busyId={busyId} onDelete={(id) => void act(id, 'delete-upload')} />
        ) : (
          !error && <p className="text-xs text-slate">Loading…</p>
        )}
      </div>
    </div>
  )
}
