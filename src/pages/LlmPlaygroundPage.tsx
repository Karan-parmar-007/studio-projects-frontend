import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, FileText, Sparkles } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CopyButton } from '@/components/CopyButton'
import { ApiError, runAndWait } from '@/lib/api'

type Mode = 'chat' | 'format'
type Turn = { role: 'user' | 'assistant'; text: string }

function conversationText(turns: Turn[], next: string): string {
  const recent = [...turns, { role: 'user' as const, text: next }].slice(-8)
  const lines = recent.map((turn) => `${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.text}`)
  return `Continue this conversation. Reply only with the next assistant message.\n\n${lines.join('\n')}\nAssistant:`
}

export function LlmPlaygroundPage() {
  const [mode, setMode] = useState<Mode>('chat')
  const [draft, setDraft] = useState('')
  const [turns, setTurns] = useState<Turn[]>([])
  const [source, setSource] = useState('')
  const [script, setScript] = useState<'roman' | 'devanagari'>('roman')
  const [formatted, setFormatted] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function sendChat() {
    const message = draft.trim()
    if (!message || busy) return
    setBusy(true)
    setError('')
    setStatus('Sending…')
    const history = turns
    setTurns((current) => [...current, { role: 'user', text: message }])
    setDraft('')
    try {
      const answer = await runAndWait('llm', 'chat', { text: conversationText(history, message) }, setStatus)
      const reply = answer.replace(/^Assistant:\s*/i, '').trim()
      setTurns((current) => [...current, { role: 'assistant', text: reply || answer }])
      setStatus('')
    } catch (err) {
      setStatus('')
      setError(err instanceof ApiError ? err.message : 'The request failed')
    } finally {
      setBusy(false)
    }
  }

  async function formatText() {
    const text = source.trim()
    if (!text || busy) return
    setBusy(true)
    setError('')
    setFormatted('')
    setStatus('Cleaning up the text…')
    try {
      const answer = await runAndWait('llm', 'format', { text, script }, setStatus)
      setFormatted(answer)
      setStatus('')
    } catch (err) {
      setStatus('')
      setError(err instanceof ApiError ? err.message : 'The request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 border-b border-navy-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">LLM Playground</h1>
            <p className="text-sm leading-relaxed text-slate">
              Try the chatbot, or paste text and have Qwen 2.5 7B clean it up. Nothing you send is stored.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/products/llm"
              className="inline-flex items-center gap-1.5 rounded-xl border border-navy-border bg-light-navy px-3.5 py-2 text-xs font-medium text-white hover:border-green/40"
            >
              <FileText className="h-3.5 w-3.5" />
              Overview
            </Link>
            <Link
              to="/products/llm/docs"
              className="inline-flex items-center gap-1.5 rounded-xl border border-navy-border bg-light-navy px-3.5 py-2 text-xs font-medium text-white hover:border-green/40"
            >
              <BookOpen className="h-3.5 w-3.5 text-green" />
              Docs
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('chat')
              setError('')
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              mode === 'chat' ? 'bg-green-tint text-green border border-green/30' : 'text-slate hover:text-white'
            }`}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('format')
              setError('')
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              mode === 'format' ? 'bg-green-tint text-green border border-green/30' : 'text-slate hover:text-white'
            }`}
          >
            Clean up text
          </button>
        </div>

        {mode === 'chat' && (
          <div className="space-y-4">
            <div className="min-h-48 space-y-3 rounded-2xl border border-navy-border bg-light-navy p-5">
              {turns.length === 0 && (
                <p className="text-sm text-slate">Ask something. The reply shows up here.</p>
              )}
              {turns.map((turn, index) => (
                <div
                  key={`${turn.role}-${index}`}
                  className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    turn.role === 'user'
                      ? 'ml-auto bg-navy text-white'
                      : 'border border-navy-border bg-navy/40 text-white'
                  }`}
                >
                  {turn.text}
                </div>
              ))}
            </div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={4}
              placeholder="Ask something"
              className="w-full rounded-2xl border border-navy-border bg-light-navy px-4 py-3 text-sm text-white outline-none focus:border-green"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void sendChat()}
                disabled={busy || !draft.trim()}
                className="rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-ink hover:bg-green-hover disabled:opacity-50"
              >
                {busy ? 'Waiting…' : 'Send'}
              </button>
              {turns.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTurns([])}
                  className="text-sm text-slate hover:text-white"
                >
                  Clear chat
                </button>
              )}
            </div>
          </div>
        )}

        {mode === 'format' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">Hindi script</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScript('roman')}
                    className={`rounded-xl px-3 py-2 text-left text-sm ${
                      script === 'roman'
                        ? 'border border-green/40 bg-green-tint text-green'
                        : 'border border-navy-border text-slate'
                    }`}
                  >
                    Roman
                    <span className="mt-1 block font-mono text-xs">namaste</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScript('devanagari')}
                    className={`rounded-xl px-3 py-2 text-left text-sm ${
                      script === 'devanagari'
                        ? 'border border-green/40 bg-green-tint text-green'
                        : 'border border-navy-border text-slate'
                    }`}
                  >
                    Devanagari
                    <span className="mt-1 block font-mono text-xs">नमस्ते</span>
                  </button>
                </div>
              </div>
              <textarea
                value={source}
                onChange={(event) => setSource(event.target.value)}
                rows={8}
                placeholder="Paste the text you want cleaned up"
                className="w-full rounded-2xl border border-navy-border bg-light-navy px-4 py-3 text-sm text-white outline-none focus:border-green"
              />
              <button
                type="button"
                onClick={() => void formatText()}
                disabled={busy || !source.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-ink hover:bg-green-hover disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {busy ? 'Waiting…' : 'Clean up'}
              </button>
            </div>
            <div className="rounded-2xl border border-navy-border bg-light-navy p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Result</p>
                {formatted && <CopyButton text={formatted} label="Copy" />}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">
                {formatted || 'The cleaned text shows up here.'}
              </p>
            </div>
          </div>
        )}

        {status && <p className="text-sm text-slate">{status}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </DashboardLayout>
  )
}
