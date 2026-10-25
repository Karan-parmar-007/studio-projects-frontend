import { api, ApiError } from '@/lib/api'
import { notifyUnauthenticated, refreshSession, sso } from '@/lib/sso'

export type GmapsQuota = { limit: number; used: number; remaining: number; day: string }

export type Company = Record<string, unknown>

export type RunPayload = {
  search_term: string
  countries: string[]
  states: string[]
  cities: string[]
  limit?: number
}

export type RunHandlers = {
  onStarted?: (data: Record<string, unknown>) => void
  onProgress?: (data: Record<string, unknown>) => void
  onCompany?: (company: Company) => void
  onCompleted?: (data: Record<string, unknown>) => void
  onError?: (message: string) => void
}

export const gmapsQuota = () => api<GmapsQuota>('/gmaps/quota')
export const gmapsStates = () => api<{ items: string[] }>('/gmaps/locations/states').then((r) => r.items)
export const gmapsCountries = () => api<{ items: string[] }>('/gmaps/locations/countries').then((r) => r.items)

export function gmapsCities(states: string[]): Promise<string[]> {
  const params = new URLSearchParams()
  for (const state of states) params.append('state', state)
  const query = params.toString()
  return api<{ items: string[] }>(`/gmaps/locations/cities${query ? `?${query}` : ''}`).then((r) => r.items)
}

function openRun(payload: RunPayload, signal?: AbortSignal): Promise<Response> {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const csrf = sso.csrfToken()
  if (csrf) headers.set('X-CSRF-Token', csrf)
  return fetch('/api/studio/gmaps/runs/stream', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(payload),
    signal,
  })
}

async function errorOf(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => ({}))
  const detail = typeof body.detail === 'string' ? body.detail : 'The search could not start'
  return new ApiError(response.status, detail)
}

/**
 * Start a search and read its NDJSON stream. Auth is checked once, when the stream opens:
 * 401 refreshes the session and tries once more. A dropped stream is never reopened,
 * because that would start a second run and spend quota again.
 */
export async function streamRun(payload: RunPayload, handlers: RunHandlers, signal?: AbortSignal): Promise<void> {
  let response = await openRun(payload, signal)
  if (response.status === 401 && (await refreshSession())) response = await openRun(payload, signal)
  if (response.status === 401) {
    notifyUnauthenticated()
    throw new ApiError(401, 'Sign in to continue')
  }
  if (!response.ok) throw await errorOf(response)
  if (!response.body) throw new ApiError(502, 'The search did not stream back')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const handle = (line: string) => {
    const text = line.trim()
    if (!text) return
    let event: { type?: string; data?: Record<string, unknown> }
    try {
      event = JSON.parse(text)
    } catch {
      return
    }
    const data = event.data ?? {}
    if (event.type === 'started') handlers.onStarted?.(data)
    else if (event.type === 'progress') handlers.onProgress?.(data)
    else if (event.type === 'company' && data.company) handlers.onCompany?.(data.company as Company)
    else if (event.type === 'completed') handlers.onCompleted?.(data)
    else if (event.type === 'error') handlers.onError?.(String(data.message || 'The search failed'))
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

const CSV_COLUMNS = ['name', 'phone', 'phone_e164', 'website', 'rating', 'review_count', 'full_address', 'city', 'state', 'zip_code', 'categories']

export function downloadCsv(rows: Company[], filename: string): void {
  if (!rows.length) return
  const extra = Object.keys(rows[0]).filter((key) => !CSV_COLUMNS.includes(key))
  const keys = [...CSV_COLUMNS.filter((key) => rows.some((row) => key in row)), ...extra]
  const cell = (value: unknown) => {
    const text = value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)
    // A leading = @ (or + - not followed by a plain number) would run as a formula in Excel or Sheets.
    const formula = /^[=@\t\r]/.test(text) || /^[+-](?![\d\s().-]+$)/.test(text)
    const safe = formula ? `'${text}` : text
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  const lines = [keys.join(','), ...rows.map((row) => keys.map((key) => cell(row[key])).join(','))]
  const url = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
