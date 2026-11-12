// Shared with /home/karan/my_website/new_frontend/portfolio_frontend/src/components/chat: keep both copies in sync.
import { useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE, csrfToken, refreshSession } from './site'
import type { Answer, AnswerError, StreamEvent } from './types'

export function emptyAnswer(): Answer {
  return {
    text: '',
    sources: [],
    figures: [],
    stage: null,
    ahead: 0,
    waited: 0,
    tools: [],
    actions: [],
    error: null,
    done: false,
    cached: false,
    found: null,
    stopped: false,
  }
}

/** A request the server refused before it started streaming (401, 409, 429, 503, ...). */
export class StreamRefused extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

const FALLBACK_CODES: Record<number, string> = {
  401: 'sign_in',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  422: 'invalid',
  429: 'busy',
  503: 'service_off',
}

function detailOf(body: unknown): string {
  if (!body || typeof body !== 'object') return ''
  const detail = (body as { detail?: unknown }).detail
  if (typeof detail === 'string') return detail
  // FastAPI request validation: [{msg: "..."}]
  if (Array.isArray(detail) && detail[0] && typeof detail[0] === 'object') {
    const msg = (detail[0] as { msg?: unknown }).msg
    if (typeof msg === 'string') return msg
  }
  return ''
}

async function refusalOf(response: Response): Promise<StreamRefused> {
  const body: unknown = await response.json().catch(() => null)
  const code =
    body && typeof body === 'object' && typeof (body as { code?: unknown }).code === 'string'
      ? String((body as { code: string }).code)
      : (FALLBACK_CODES[response.status] ?? 'error')
  const message =
    detailOf(body) ||
    (response.status === 401 ? 'Sign in to use this.' : `The request failed (${response.status}).`)
  return new StreamRefused(response.status, code, message)
}

function post(path: string, body: unknown, signal: AbortSignal): Promise<Response> {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const csrf = csrfToken()
  if (csrf) headers.set('X-CSRF-Token', csrf)
  return fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(body),
    signal,
  })
}

/**
 * POST and read an NDJSON stream, one event per line. A 401 refreshes the session and tries
 * once more. A dropped stream is never reopened (that would ask the model a second time).
 */
export async function streamNdjson(
  path: string,
  body: unknown,
  onEvent: (event: StreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  let response = await post(path, body, signal)
  if (response.status === 401 && (await refreshSession())) response = await post(path, body, signal)
  if (!response.ok) throw await refusalOf(response)
  if (!response.body) throw new StreamRefused(502, 'error', 'The answer did not stream back.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const handle = (line: string) => {
    const text = line.trim()
    if (!text) return
    try {
      const event = JSON.parse(text) as StreamEvent
      if (event && typeof event.type === 'string' && event.data) onEvent(event)
    } catch {
      /* skip a broken line */
    }
  }
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    lines.forEach(handle)
  }
  handle(buffer + decoder.decode())
}

export function applyEvent(answer: Answer, event: StreamEvent): Answer {
  switch (event.type) {
    case 'status':
      return {
        ...answer,
        stage: event.data.stage,
        ahead: Number(event.data.ahead) || 0,
        waited: Number(event.data.waited) || 0,
      }
    case 'sources':
      return { ...answer, sources: event.data.sources ?? [], figures: event.data.figures ?? [] }
    case 'token':
      return { ...answer, stage: 'writing', text: answer.text + (event.data.text ?? '') }
    case 'tool':
      return answer.tools.includes(event.data.name) ? answer : { ...answer, tools: [...answer.tools, event.data.name] }
    case 'action':
      return { ...answer, actions: [...answer.actions, event.data] }
    case 'done':
      return { ...answer, done: true, stage: null, cached: Boolean(event.data.cached), found: Boolean(event.data.found) }
    case 'error':
      return {
        ...answer,
        stage: null,
        error: { message: event.data.message || 'Something went wrong. Try again.', code: event.data.code || 'error' },
      }
    default:
      return answer
  }
}

function errorOf(err: unknown): AnswerError {
  if (err instanceof StreamRefused) return { message: err.message, code: err.code, status: err.status }
  return { message: 'Could not reach the server. Check your connection and try again.', code: 'network' }
}

/**
 * Run one streamed answer at a time. `answer` updates as events arrive; `run` resolves with
 * the final answer (also when stopped or failed, with `stopped` or `error` set).
 */
export function useNdjsonStream() {
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [running, setRunning] = useState(false)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const run = useCallback(async (path: string, body: unknown): Promise<Answer> => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    let current: Answer = { ...emptyAnswer(), stage: 'searching' }
    setAnswer(current)
    setRunning(true)
    try {
      await streamNdjson(
        path,
        body,
        (event) => {
          current = applyEvent(current, event)
          setAnswer(current)
        },
        controller.signal,
      )
      if (!current.done && !current.error) current = { ...current, stage: null, done: true }
    } catch (err) {
      current = controller.signal.aborted
        ? { ...current, stage: null, stopped: true }
        : { ...current, stage: null, error: errorOf(err) }
    }
    // A newer run (or a reset) took over: leave its state alone.
    if (controllerRef.current === controller) {
      controllerRef.current = null
      setRunning(false)
      setAnswer(current)
    }
    return current
  }, [])

  const stop = useCallback(() => controllerRef.current?.abort(), [])
  const reset = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setRunning(false)
    setAnswer(null)
  }, [])

  return { answer, running, run, stop, reset }
}

/**
 * What the person is waiting for: searching, their place in line (the model writes one answer at
 * a time), the model reading the question (slow on the CPU server), or writing.
 */
export function progressLabel(answer: Answer): string {
  const seconds = answer.waited > 0 ? ` · ${answer.waited}s` : ''
  switch (answer.stage) {
    case 'waiting':
      return `In line: ${answer.ahead} ${answer.ahead === 1 ? 'person' : 'people'} ahead of you${seconds}`
    case 'thinking':
      return `Thinking about your question…${seconds}`
    case 'writing':
      return 'Writing…'
    default:
      return 'Searching…'
  }
}

/** Answer text without citation markers, for sending back as history. */
export function plainText(text: string): string {
  return text.replace(/\s?\[\d{1,3}\](?!\()/g, '').trim()
}
