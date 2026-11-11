// Shared with /home/karan/my_website/new_frontend/portfolio_frontend/src/components/chat: keep both copies in sync.
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, Bot, Loader2, LogIn, MessageCircle, RotateCcw, Send, Square, Wrench, X } from 'lucide-react'
import { GmapsActionCard } from './GmapsActionCard'
import { SourceChips } from './SourceChips'
import { SURFACE, loginUrl, tone, useChatConfig, useReduced } from './site'
import { plainText, progressLabel, useNdjsonStream } from './useNdjsonStream'
import type { Answer, Turn } from './types'

const MAX_MESSAGE = 1000
const MAX_TURNS = 12
const STORE_KEY = `site-chat:${SURFACE}:v1`
const OPEN_EVENT = 'site-chat:open'

// Markdown (react-markdown + remark-gfm) loads when the panel first opens, not with the page.
const Markdown = lazy(() => import('./Markdown').then((module) => ({ default: module.Markdown })))

function RichText({ text, sources }: { text: string; sources?: Answer['sources'] }) {
  return (
    <Suspense fallback={<p className="whitespace-pre-wrap">{text}</p>}>
      <Markdown text={text} sources={sources} />
    </Suspense>
  )
}

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; answer?: Answer }

/** Open the assistant from anywhere (e.g. a "Try the assistant" button). */
export function openChat(): void {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT))
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : []
  } catch {
    return []
  }
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** The last turns, answers as plain text. Failed or empty answers are left out. */
function historyOf(messages: ChatMessage[]): Turn[] {
  return messages
    .filter((message) => message.role === 'user' || (message.content.trim() && !message.answer?.error))
    .slice(-MAX_TURNS)
    .map((message) => ({
      role: message.role,
      content: (message.role === 'assistant' ? plainText(message.content) : message.content).slice(0, 4000),
    }))
}

const TOOL_LABELS: Record<string, string> = {
  maps_scraper_quota: 'Checked Maps Scraper quota',
  prepare_maps_search: 'Prepared a Maps Scraper search',
}

function AssistantBubble({
  answer,
  live,
  signedIn,
  onRun,
}: {
  answer: Answer
  live: boolean
  signedIn: boolean
  onRun: () => void
}) {
  return (
    <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-navy-border bg-navy/70 px-3.5 py-2.5 text-sm leading-relaxed text-light-slate">
      {answer.tools.map((name) => (
        <p key={name} className="mb-1.5 flex items-center gap-1.5 text-[11px] text-slate">
          <Wrench className="h-3 w-3 text-green" aria-hidden="true" />
          {TOOL_LABELS[name] ?? `Used ${name.replace(/_/g, ' ')}`}
        </p>
      ))}
      {answer.text && <RichText text={answer.text} sources={answer.sources} />}
      {live && answer.stage && (
        <p className="flex items-center gap-2 text-xs text-slate" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-green" aria-hidden="true" />
          {progressLabel(answer)}
        </p>
      )}
      {answer.actions.map((action, index) => (
        <GmapsActionCard key={index} action={action} onRun={onRun} />
      ))}
      {answer.error && (
        <div className="mt-1 flex items-start gap-2 text-xs text-red-500">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {answer.error.message}
            {answer.error.code === 'sign_in' && !signedIn && (
              <>
                {' '}
                <a href={loginUrl()} className="font-semibold text-green underline underline-offset-2">
                  Sign in
                </a>
              </>
            )}
          </span>
        </div>
      )}
      {answer.stopped && <p className="mt-1 text-xs text-slate">Stopped.</p>}
      {!live && <SourceChips sources={answer.sources} />}
    </div>
  )
}

/** The site assistant: a floating button bottom-right that opens a chat panel. */
export function ChatWidget() {
  const config = useChatConfig()
  const reduced = useReduced()
  const { answer, running, run, stop, reset } = useNdjsonStream()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages)
  const [input, setInput] = useState('')
  const panelRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bubbleRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef(0)

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-40)))
    } catch {
      /* storage full or blocked */
    }
  }, [messages])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  // Focus the input when the panel opens and when an answer finishes.
  useEffect(() => {
    if (open && !running) inputRef.current?.focus()
  }, [open, running])

  // Keep the newest message in view.
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages, answer, open])

  const close = useCallback(() => {
    setOpen(false)
    bubbleRef.current?.focus()
  }, [])

  const send = useCallback(
    async (text: string) => {
      const message = text.trim().slice(0, MAX_MESSAGE)
      if (!message || running || !config?.can_use) return
      const chat = chatRef.current
      const history = historyOf(messages)
      setMessages((current) => [...current, { id: newId(), role: 'user', content: message }])
      setInput('')
      if (inputRef.current) inputRef.current.style.height = ''
      const final = await run('/chatbot/chat', { message, history, surface: SURFACE })
      if (chatRef.current !== chat) return
      setMessages((current) => [...current, { id: newId(), role: 'assistant', content: final.text, answer: final }])
      reset()
    },
    [config?.can_use, messages, reset, run, running],
  )

  function newChat() {
    chatRef.current += 1
    reset()
    setMessages([])
    setInput('')
    inputRef.current?.focus()
  }

  function onPanelKey(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      close()
      return
    }
    if (event.key !== 'Tab' || !panelRef.current) return
    // Focus trap-lite: Tab wraps inside the panel.
    const focusable = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function onInputKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void send(input)
    }
  }

  if (!config?.enabled) return null

  const signedIn = config.signed_in
  const empty = messages.length === 0 && !answer
  const motionProps = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 16, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 16, scale: 0.98 },
        transition: { duration: 0.18 },
      }

  return (
    <>
      <button
        ref={bubbleRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={open ? 'Close the assistant' : 'Open the assistant'}
        aria-expanded={open}
        className={`fixed z-[60] h-14 w-14 items-center justify-center rounded-full shadow-xl transition-transform motion-safe:hover:scale-105 ${tone.solid} ${tone.bubble} ${
          open ? 'hidden sm:flex' : 'flex'
        }`}
      >
        {open ? <X className="h-6 w-6" aria-hidden="true" /> : <MessageCircle className="h-6 w-6" aria-hidden="true" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            key="chat-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-label="Site assistant"
            onKeyDown={onPanelKey}
            {...motionProps}
            className={`fixed inset-0 z-[70] flex flex-col overflow-hidden bg-light-navy text-light-slate shadow-2xl sm:inset-auto sm:h-[560px] sm:max-h-[calc(100vh-8rem)] sm:w-[380px] sm:rounded-2xl sm:border sm:border-navy-border ${tone.panel}`}
          >
            <header className="flex items-center justify-between gap-2 border-b border-navy-border px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-green/30 bg-green-tint text-green">
                  <Bot className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-white">Assistant</h2>
                  <p className="truncate text-[11px] text-slate">Ask about Karan and Studio</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={newChat}
                  disabled={empty}
                  aria-label="New chat"
                  title="New chat"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate hover:bg-navy hover:text-white disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close the assistant"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate hover:bg-navy hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {empty && (
                <div className="space-y-3">
                  <div className="max-w-[92%] rounded-2xl rounded-tl-md border border-navy-border bg-navy/70 px-3.5 py-2.5 text-sm leading-relaxed text-light-slate">
                    <RichText text={config.greeting || 'Hi! Ask me anything about Karan or Studio.'} />
                  </div>
                  {config.can_use && config.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {config.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => void send(suggestion)}
                          className="rounded-full border border-green/30 bg-green-tint px-3 py-1.5 text-left text-xs text-green hover:border-green/60"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((message) =>
                message.role === 'user' ? (
                  <div key={message.id} className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-md border border-green/30 bg-green-tint px-3.5 py-2 text-sm text-white">
                      {message.content}
                    </p>
                  </div>
                ) : message.answer ? (
                  <AssistantBubble key={message.id} answer={message.answer} live={false} signedIn={signedIn} onRun={close} />
                ) : null,
              )}

              {answer && <AssistantBubble answer={answer} live={running} signedIn={signedIn} onRun={close} />}
            </div>

            <footer className="border-t border-navy-border p-3">
              {config.can_use ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    void send(input)
                  }}
                  className="flex items-end gap-2"
                >
                  <label htmlFor="site-chat-input" className="sr-only">
                    Your message
                  </label>
                  <textarea
                    id="site-chat-input"
                    ref={inputRef}
                    rows={1}
                    value={input}
                    maxLength={MAX_MESSAGE}
                    disabled={running}
                    onChange={(event) => setInput(event.target.value)}
                    onInput={(event) => {
                      const el = event.currentTarget
                      el.style.height = 'auto'
                      el.style.height = `${Math.min(el.scrollHeight, 128)}px`
                    }}
                    onKeyDown={onInputKey}
                    placeholder={running ? 'Answering…' : 'Ask a question'}
                    className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-navy-border bg-navy px-3 py-2 text-sm text-white placeholder:text-slate disabled:opacity-60"
                  />
                  {running ? (
                    <button
                      type="button"
                      onClick={stop}
                      aria-label="Stop the answer"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-navy-border bg-navy text-white hover:border-green/40"
                    >
                      <Square className="h-4 w-4" aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      aria-label="Send"
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl disabled:opacity-40 ${tone.solid}`}
                    >
                      <Send className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </form>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate">
                  <span>{config.reason || 'The assistant is not available right now.'}</span>
                  {!signedIn && (
                    <a href={loginUrl()} className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-semibold ${tone.solid}`}>
                      <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                      Sign in
                    </a>
                  )}
                </div>
              )}
              {config.can_use && input.length > MAX_MESSAGE - 200 && (
                <p className="mt-1 text-right text-[11px] text-slate">
                  {input.length}/{MAX_MESSAGE}
                </p>
              )}
            </footer>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}
