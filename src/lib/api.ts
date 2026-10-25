import { notifyUnauthenticated, refreshSession, sso } from '@/lib/sso'

export class ApiError extends Error {
  status: number
  checks: Array<Record<string, unknown>>

  constructor(status: number, message: string, checks: Array<Record<string, unknown>> = []) {
    super(message)
    this.status = status
    this.checks = checks
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const run = () => {
    const headers = new Headers(init.headers)
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    const method = (init.method || 'GET').toUpperCase()
    if (method !== 'GET' && method !== 'HEAD') {
      const csrf = sso.csrfToken()
      if (csrf) headers.set('X-CSRF-Token', csrf)
    }
    return fetch(`/api/studio${path}`, {
      ...init,
      headers,
      credentials: 'include',
    })
  }

  let response = await run()
  if (response.status === 401) {
    const stillIn = await refreshSession()
    if (!stillIn) {
      notifyUnauthenticated()
      throw new ApiError(401, 'Sign in to continue')
    }
    response = await run()
  }

  if (response.status === 204) return undefined as T
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = typeof body.detail === 'string' ? body.detail : 'Request failed'
    throw new ApiError(response.status, detail, Array.isArray(body.checks) ? body.checks : [])
  }
  return body as T
}

export type Endpoint = {
  operation: string
  method: string
  path: string
  summary: string
}

export type Project = {
  slug: string
  name: string
  tagline: string
  description: string
  status: 'live' | 'soon'
  enabled?: boolean
  page: string
  playground: boolean
  apps: string[]
  endpoints: Endpoint[]
}

export type ApiKey = {
  id: string
  name: string
  prefix: string
  created_at: string
  last_used_at: string | null
  secret?: string
}

export type ModelLink = {
  id: string
  project: string
  role: 'speech' | 'llm'
  placement: 'local' | 'remote'
  url: string
  enabled: boolean
}

export type DownloadItem = {
  id: string
  product: string
  platform: 'windows' | 'macos' | 'linux' | 'android'
  filename: string
  content_type: string
  size: number
  version: string
  updated_at: string
}

// A direct, same-origin URL to stream a binary (Caddy in prod, Vite proxy in dev).
export function downloadUrl(product: string, platform: string): string {
  return `/api/studio/downloads/${product}/${platform}`
}

export type ModelAnswer = {
  text?: string
  status?: string
  detail?: string
  job_id?: string
  lane?: string
  position?: number
  result?: { text?: string }
}

/**
 * Run a signed-in model call for a project and wait out the queue.
 * `onStatus` gets "queued, position N" style messages while we poll.
 */
export async function runAndWait(
  project: string,
  operation: string,
  payload: Record<string, unknown>,
  onStatus: (message: string) => void,
): Promise<string> {
  let body = await api<ModelAnswer>(`/${project}/${operation}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (body.status === 'queued' && body.job_id) {
      onStatus(`Your request is queued. ${body.lane ?? 'voice'} line, position ${body.position ?? 1}.`)
    } else if (body.status === 'running' && body.job_id) {
      onStatus('Your request is running.')
    } else if (body.status === 'done') {
      return body.result?.text ?? ''
    } else if (body.status === 'error') {
      throw new ApiError(502, body.detail || 'The request failed')
    } else {
      return body.text ?? ''
    }
    await new Promise((resolve) => setTimeout(resolve, 1500))
    body = await api<ModelAnswer>(`/${project}/jobs/${body.job_id}`)
  }
  throw new ApiError(504, 'The queue did not finish in time')
}
