import { lazy, Suspense, useCallback, useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  BookOpen,
  FileText,
  Library,
  Loader2,
  LogIn,
  RotateCcw,
  Send,
  Square,
  Trash2,
  Upload,
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { FigureGallery } from '@/chat/FigureGallery'
import { SourceChips } from '@/chat/SourceChips'
import { plainText, progressLabel, useNdjsonStream } from '@/chat/useNdjsonStream'
import type { Answer, Turn } from '@/chat/types'
import { ApiError } from '@/lib/api'
import {
  STAGE_LABELS,
  building,
  deleteUpload,
  formatBytes,
  myUpload,
  postFile,
  ragStatus,
  stillFinishing,
  type RagSource,
  type RagStatus,
} from '@/lib/rag'
import { sso } from '@/lib/sso'

// Loaded on demand, like in the chat widget (react-markdown is the heavy part).
const Markdown = lazy(() => import('@/chat/Markdown').then((module) => ({ default: module.Markdown })))

type Target = 'book' | 'upload'
type Exchange = { id: string; question: string; answer: Answer }

const MAX_QUESTION = 1000
const HISTORY_EXCHANGES = 4 // 8 turns

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError || err instanceof Error ? err.message : fallback
}

function historyOf(thread: Exchange[]): Turn[] {
  return thread
    .filter((item) => item.answer.text.trim() && !item.answer.error)
    .slice(-HISTORY_EXCHANGES)
    .flatMap((item): Turn[] => [
      { role: 'user', content: item.question },
      { role: 'assistant', content: plainText(item.answer.text).slice(0, 4000) },
    ])
}

/** Seconds left until `iso`, ticking every second. */
function useSecondsLeft(iso: string | null | undefined): number | null {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!iso) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [iso])
  if (!iso) return null
  return Math.max(0, Math.floor((new Date(iso).getTime() - now) / 1000))
}

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function ProgressBar({ source }: { source: RagSource }) {
  const percent = Math.max(2, Math.min(100, source.progress || 0))
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-white">{STAGE_LABELS[source.stage] ?? source.stage}…</span>
        <span className="font-mono text-slate">{source.progress}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-navy" role="progressbar" aria-valuenow={source.progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-green transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-[11px] text-slate">Reading → Understanding → Linking ideas → Describing figures</p>
    </div>
  )
}

function Facts({ source }: { source: RagSource }) {
  const facts = [
    source.pages != null ? `${source.pages} pages` : '',
    source.figures != null ? `${source.figures} figures` : '',
    source.chunks != null ? `${source.chunks} passages` : '',
  ].filter(Boolean)
  return (
    <div>
      <p className="font-semibold text-white">{source.title || source.filename}</p>
      {facts.length > 0 && <p className="mt-0.5 text-xs text-slate">{facts.join(' · ')}</p>}
    </div>
  )
}

function AnswerView({ answer, live, signedIn }: { answer: Answer; live: boolean; signedIn: boolean }) {
  return (
    <div className="rounded-2xl rounded-tl-md border border-navy-border bg-light-navy px-5 py-4 text-sm leading-relaxed text-light-slate">
      {answer.text && (
        <Suspense fallback={<p className="whitespace-pre-wrap">{answer.text}</p>}>
          <Markdown text={answer.text} sources={answer.sources} />
        </Suspense>
      )}
      {live && answer.stage && (
        <p className="flex items-center gap-2 text-xs text-slate" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-green" />
          {progressLabel(answer)}
          <span className="text-slate/70">· answers can take up to a minute</span>
        </p>
      )}
      {answer.error && (
        <p className="mt-1 flex items-start gap-2 text-xs text-red-500">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {answer.error.message}
            {answer.error.code === 'sign_in' && !signedIn && (
              <>
                {' '}
                <a href={sso.loginUrl('/products/rag/playground')} className="font-semibold text-green underline">
                  Sign in
                </a>
              </>
            )}
          </span>
        </p>
      )}
      {answer.stopped && <p className="mt-1 text-xs text-slate">Stopped.</p>}
      {answer.done && !answer.error && answer.found === false && !answer.text.trim() && (
        <p className="text-xs text-slate">Nothing in the document matched that question.</p>
      )}
      <SourceChips sources={answer.sources} defaultOpen={!live} />
      <FigureGallery figures={answer.figures} />
    </div>
  )
}

export function RagPlaygroundPage() {
  const [status, setStatus] = useState<RagStatus | null>(null)
  const [loadError, setLoadError] = useState('')
  const [target, setTarget] = useState<Target>('book')
  // One book from the shelf, or 'all' to search every book at once.
  const [bookId, setBookId] = useState<string>('all')
  const [upload, setUpload] = useState<RagSource | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [question, setQuestion] = useState('')
  const [threads, setThreads] = useState<Record<Target, Exchange[]>>({ book: [], upload: [] })
  const [pending, setPending] = useState<{ target: Target; question: string } | null>(null)
  const { answer, running, run, stop, reset } = useNdjsonStream()
  const fileRef = useRef<HTMLInputElement>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    ragStatus()
      .then((next) => {
        setStatus(next)
        setUpload(next.upload)
        setLoadError('')
      })
      .catch((err) => setLoadError(messageOf(err, 'Could not load Ask a Document')))
  }, [])

  useEffect(load, [load])

  // Poll the upload while it is being read (and while its figures are still described).
  const watching = building(upload) || stillFinishing(upload)
  useEffect(() => {
    if (!watching) return
    const timer = window.setInterval(() => {
      myUpload()
        .then(setUpload)
        .catch(() => undefined)
    }, 2000)
    return () => window.clearInterval(timer)
  }, [watching])

  const secondsLeft = useSecondsLeft(upload?.expires_at)
  const expired = secondsLeft === 0
  useEffect(() => {
    if (!expired) return
    setThreads((current) => ({ ...current, upload: [] }))
    myUpload()
      .then(setUpload)
      .catch(() => setUpload(null))
  }, [expired])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [threads, answer?.text, pending])

  const books = status?.books ?? []
  const book = bookId === 'all' ? null : (books.find((item) => item.id === bookId) ?? null)
  // A book that was deleted meanwhile: fall back to all books.
  useEffect(() => {
    if (bookId !== 'all' && status && !books.some((item) => item.id === bookId)) setBookId('all')
  }, [bookId, books, status])
  const signedIn = status?.signed_in ?? false
  const ready = target === 'book' ? books.length > 0 : Boolean(upload && upload.status === 'ready' && !expired)
  const canAsk = Boolean(status?.can_use) && ready && !running && question.trim().length > 0

  async function ask(text: string) {
    const q = text.trim().slice(0, MAX_QUESTION)
    if (!q || running || !status?.can_use || !ready) return
    const on = target
    setPending({ target: on, question: q })
    setQuestion('')
    const final = await run('/rag/ask', {
      question: q,
      target: on,
      history: historyOf(threads[on]),
      ...(on === 'book' && bookId !== 'all' ? { book_id: bookId } : {}),
    })
    setThreads((current) => ({
      ...current,
      [on]: [...current[on], { id: `${Date.now()}`, question: q, answer: final }],
    }))
    setPending(null)
    reset()
  }

  function onKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void ask(question)
    }
  }

  async function sendFile(file: File) {
    if (!status) return
    setUploadError('')
    const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`
    if (status.accepted.length && !status.accepted.includes(ext)) {
      setUploadError(`That file type is not supported. Use ${status.accepted.join(', ')}.`)
      return
    }
    if (file.size > status.upload_max_mb * 1024 * 1024) {
      setUploadError(`That file is ${formatBytes(file.size)}. The limit is ${status.upload_max_mb} MB.`)
      return
    }
    setUploading(true)
    try {
      setUpload(await postFile<RagSource>('/rag/upload', file))
      setThreads((current) => ({ ...current, upload: [] }))
    } catch (err) {
      setUploadError(
        err instanceof ApiError && err.status === 409
          ? `${err.message} Delete your current document first.`
          : messageOf(err, 'The upload failed'),
      )
      if (err instanceof ApiError && err.status === 409) myUpload().then(setUpload).catch(() => undefined)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function removeUpload() {
    setDeleting(true)
    setUploadError('')
    try {
      await deleteUpload()
      setUpload(null)
      setThreads((current) => ({ ...current, upload: [] }))
      setConfirmDelete(false)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setUpload(null)
      else setUploadError(messageOf(err, 'Could not delete the document'))
    } finally {
      setDeleting(false)
    }
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file && !uploading) void sendFile(file)
  }

  const thread = threads[target]
  const showPending = pending && pending.target === target && answer

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy-border pb-5">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Ask a Document playground</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate">
              Ask the books on the shelf, or upload your own document. Answers cite the passages they use: hover a number to
              read it.
            </p>
          </div>
          <Link
            to="/products/rag/docs"
            className="inline-flex items-center gap-1.5 rounded-full border border-navy-border bg-light-navy px-4 py-2 text-sm font-medium text-white hover:border-green/40"
          >
            <BookOpen className="h-4 w-4 text-green" />
            API docs
          </Link>
        </div>

        {loadError && (
          <p className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {loadError}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <div className="flex rounded-xl border border-navy-border bg-navy/80 p-1" role="tablist" aria-label="Document">
              {(['book', 'upload'] as Target[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={target === tab}
                  disabled={running}
                  onClick={() => setTarget(tab)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed ${
                    target === tab ? 'bg-green-tint text-green' : 'text-slate hover:text-white'
                  }`}
                >
                  {tab === 'book' ? <Library className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                  {tab === 'book' ? (books.length > 1 ? 'Books' : 'The book') : 'My document'}
                </button>
              ))}
            </div>

            <div className="space-y-4 rounded-2xl border border-navy-border bg-light-navy p-5 text-sm">
              {!status && !loadError ? (
                <p className="flex items-center gap-2 text-xs text-slate">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
                </p>
              ) : !status ? null : target === 'book' ? (
                books.length ? (
                  <div className="space-y-3">
                    {books.length > 1 && (
                      <div className="space-y-1.5" role="radiogroup" aria-label="Which book">
                        {[{ id: 'all', title: `All ${books.length} books` }, ...books].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            role="radio"
                            aria-checked={bookId === item.id}
                            disabled={running}
                            onClick={() => {
                              if (item.id === bookId) return
                              setBookId(item.id)
                              setThreads((current) => ({ ...current, book: [] }))
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-semibold disabled:cursor-not-allowed ${
                              bookId === item.id
                                ? 'border-green/40 bg-green-tint text-green'
                                : 'border-navy-border bg-navy/40 text-slate hover:text-white'
                            }`}
                          >
                            <Library className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{item.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {(book ? [book] : books.length === 1 ? books : []).map((item) => (
                      <div key={item.id} className="space-y-1">
                        <Facts source={item} />
                        {stillFinishing(item) && <p className="text-xs text-slate">Figures are still being described.</p>}
                      </div>
                    ))}
                    {!book && books.length > 1 && (
                      <p className="text-xs text-slate">Questions search every book. Pick one to narrow it down.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate">No book is ready yet. Check back soon.</p>
                )
              ) : !signedIn ? (
                <div className="space-y-3">
                  <p className="text-slate">Sign in to upload a document of your own.</p>
                  <a
                    href={sso.loginUrl('/products/rag/playground')}
                    className="inline-flex items-center gap-2 rounded-full bg-green px-4 py-2 text-xs font-semibold text-ink hover:bg-green-hover"
                  >
                    <LogIn className="h-3.5 w-3.5" /> Sign in
                  </a>
                </div>
              ) : !upload ? (
                status.uploads_enabled ? (
                  <label
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDragging(true)
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                      dragging ? 'border-green/60 bg-green-tint' : 'border-navy-border bg-navy/40 hover:border-green/50'
                    } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    {uploading ? <Loader2 className="mb-2 h-6 w-6 animate-spin text-green" /> : <Upload className="mb-2 h-6 w-6 text-green" />}
                    <span className="text-sm font-semibold text-white">{uploading ? 'Uploading…' : 'Drop a document here'}</span>
                    <span className="mt-1 text-[11px] text-slate">
                      or click to choose · up to {status.upload_max_mb} MB, {status.upload_max_pages} pages
                    </span>
                    <span className="mt-1 text-[11px] text-slate">{status.accepted.join(' ')}</span>
                    <span className="mt-2 text-[11px] text-slate">Deleted automatically after {status.upload_ttl_minutes} minutes.</span>
                    <input
                      ref={fileRef}
                      type="file"
                      accept={status.accepted.join(',')}
                      className="sr-only"
                      disabled={uploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void sendFile(file)
                      }}
                    />
                  </label>
                ) : (
                  <p className="text-slate">Uploading your own document is switched off right now.</p>
                )
              ) : (
                <div className="space-y-4">
                  <Facts source={upload} />
                  {building(upload) && <ProgressBar source={upload} />}
                  {upload.status === 'failed' && (
                    <p className="flex items-start gap-2 text-xs text-red-500">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {upload.error || 'This document could not be read.'}
                    </p>
                  )}
                  {stillFinishing(upload) && (
                    <p className="flex items-center gap-2 text-xs text-slate">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-green" />
                      Ready to ask. Figures are still being described ({upload.progress}%).
                    </p>
                  )}
                  {secondsLeft != null && (
                    <p className="text-xs text-slate">
                      Deleted in <span className="font-mono font-semibold text-white">{mmss(secondsLeft)}</span>
                    </p>
                  )}
                  {confirmDelete ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void removeUpload()}
                        disabled={deleting}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3.5 py-1.5 text-xs font-semibold text-navy hover:bg-red-600 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deleting ? 'Deleting…' : 'Yes, delete it'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        disabled={deleting}
                        className="rounded-full border border-navy-border px-3.5 py-1.5 text-xs text-slate hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      disabled={running}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete now
                    </button>
                  )}
                </div>
              )}
              {uploadError && target === 'upload' && (
                <p className="flex items-start gap-2 text-xs text-red-500">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {uploadError}
                </p>
              )}
            </div>

            {status && !status.can_use && (
              <p className="rounded-2xl border border-navy-border bg-light-navy p-4 text-xs text-slate">
                {status.reason || 'Asking is not available right now.'}
              </p>
            )}
          </aside>

          <section className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate">
                {target === 'book'
                  ? book
                    ? `Asking ${book.title}`
                    : books.length === 1
                      ? `Asking ${books[0].title}`
                      : 'Asking all books'
                  : 'Asking your document'}
              </p>
              <button
                type="button"
                onClick={() => setThreads((current) => ({ ...current, [target]: [] }))}
                disabled={running || thread.length === 0}
                className="inline-flex items-center gap-1.5 rounded-full border border-navy-border px-3 py-1 text-xs text-slate hover:text-white disabled:opacity-40"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>

            <div className="min-h-[240px] space-y-4">
              {thread.length === 0 && !showPending && (
                <div className="rounded-2xl border border-dashed border-navy-border p-10 text-center text-sm text-slate">
                  {ready
                    ? 'Ask a question to start. Follow-up questions remember the last few answers.'
                    : target === 'book'
                      ? 'No book is ready yet.'
                      : 'Upload a document to ask about it.'}
                </div>
              )}
              {thread.map((item) => (
                <div key={item.id} className="space-y-2">
                  <p className="ml-auto max-w-[85%] w-fit whitespace-pre-wrap rounded-2xl rounded-tr-md border border-green/30 bg-green-tint px-4 py-2 text-sm text-white">
                    {item.question}
                  </p>
                  <AnswerView answer={item.answer} live={false} signedIn={signedIn} />
                </div>
              ))}
              {showPending && (
                <div className="space-y-2">
                  <p className="ml-auto max-w-[85%] w-fit whitespace-pre-wrap rounded-2xl rounded-tr-md border border-green/30 bg-green-tint px-4 py-2 text-sm text-white">
                    {pending.question}
                  </p>
                  <AnswerView answer={answer} live={running} signedIn={signedIn} />
                </div>
              )}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                void ask(question)
              }}
              className="sticky bottom-4 flex items-end gap-2 rounded-2xl border border-navy-border bg-light-navy p-3 shadow-lg"
            >
              <label htmlFor="rag-question" className="sr-only">
                Your question
              </label>
              <textarea
                id="rag-question"
                rows={2}
                value={question}
                maxLength={MAX_QUESTION}
                disabled={running || !ready || !status?.can_use}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={onKey}
                placeholder={
                  running ? 'Answering…' : ready ? 'Ask a question (Enter to send, Shift+Enter for a new line)' : 'Not ready to ask yet'
                }
                className="max-h-40 min-h-12 flex-1 resize-y rounded-xl border border-navy-border bg-navy px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-slate/60 focus:border-green/50 disabled:opacity-60"
              />
              {running ? (
                <button
                  type="button"
                  onClick={stop}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-navy-border bg-navy px-4 text-sm font-medium text-white hover:border-green/40"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canAsk}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-green px-4 text-sm font-semibold text-ink hover:bg-green-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                  Ask
                </button>
              )}
            </form>
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}
