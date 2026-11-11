import { api, ApiError } from '@/lib/api'
import { refreshSession, sso } from '@/lib/sso'

export type RagStage = 'queued' | 'parsing' | 'embedding' | 'linking' | 'graph' | 'figures' | 'complete' | 'failed'

/** A document (a book on the shelf, a user's upload, or a chatbot knowledge version). */
export type RagSource = {
  id: string
  title: string
  filename: string
  size_bytes: number
  status: 'queued' | 'processing' | 'ready' | 'failed'
  stage: RagStage
  progress: number
  error: string | null
  active: boolean
  pages: number | null
  chunks: number | null
  figures: number | null
  created_at: string | null
  ready_at: string | null
  completed_at: string | null
  expires_at: string | null
  /** Admin views only: who uploaded it. */
  owner_id?: string | null
  owner_label?: string
}

export type Access = 'everyone' | 'signed_in' | 'roles'

export type RagStatus = {
  enabled: boolean
  access: Access
  signed_in: boolean
  can_use: boolean
  reason: string
  uploads_enabled: boolean
  upload_max_mb: number
  upload_ttl_minutes: number
  upload_max_pages: number
  accepted: string[]
  /** Every live book on the shelf. */
  books: RagSource[]
  upload: RagSource | null
}

export const STAGE_LABELS: Record<RagStage, string> = {
  queued: 'Waiting in line',
  parsing: 'Reading',
  embedding: 'Understanding',
  linking: 'Linking ideas',
  graph: 'Linking ideas',
  figures: 'Describing figures',
  complete: 'Done',
  failed: 'Failed',
}

/** Still being built (figures may still be described after it turns "ready"). */
export function building(source: RagSource | null): boolean {
  if (!source) return false
  return source.status === 'queued' || source.status === 'processing'
}

export function stillFinishing(source: RagSource | null): boolean {
  return Boolean(source && source.status === 'ready' && source.stage !== 'complete')
}

export const ragStatus = () => api<RagStatus>('/rag/status')
export const myUpload = () => api<{ upload: RagSource | null }>('/rag/upload').then((body) => body.upload)
export const deleteUpload = () => api<void>('/rag/upload', { method: 'DELETE' })

async function failure(response: Response, fallback: string): Promise<ApiError> {
  const body = await response.json().catch(() => ({}))
  const detail = typeof body.detail === 'string' ? body.detail : fallback
  return new ApiError(response.status, detail)
}

/** Multipart POST with fetch. Never sets Content-Type: the browser adds the boundary. */
export async function postFile<T>(path: string, file: File): Promise<T> {
  const send = () => {
    const form = new FormData()
    form.append('file', file)
    const headers = new Headers()
    const csrf = sso.csrfToken()
    if (csrf) headers.set('X-CSRF-Token', csrf)
    return fetch(`/api/studio${path}`, { method: 'POST', body: form, headers, credentials: 'include' })
  }
  let response = await send()
  if (response.status === 401 && (await refreshSession())) response = await send()
  if (!response.ok) throw await failure(response, 'The upload failed')
  return (await response.json()) as T
}

/**
 * Multipart POST with XMLHttpRequest, for big files: `onProgress` gets 0-100 while the
 * browser sends. A 401 refreshes the session once and sends again.
 */
export function postFileWithProgress<T>(
  path: string,
  file: File,
  onProgress: (percent: number) => void,
  fields: Record<string, string> = {},
): Promise<T> {
  const send = () =>
    new Promise<{ status: number; body: unknown }>((resolve, reject) => {
      const form = new FormData()
      form.append('file', file)
      for (const [name, value] of Object.entries(fields)) if (value) form.append(name, value)
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `/api/studio${path}`)
      xhr.withCredentials = true
      const csrf = sso.csrfToken()
      if (csrf) xhr.setRequestHeader('X-CSRF-Token', csrf)
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
      }
      xhr.onload = () => {
        let body: unknown = {}
        try {
          body = JSON.parse(xhr.responseText || '{}')
        } catch {
          body = {}
        }
        resolve({ status: xhr.status, body })
      }
      xhr.onerror = () => reject(new ApiError(0, 'The upload was interrupted'))
      xhr.send(form)
    })

  return (async () => {
    let result = await send()
    if (result.status === 401 && (await refreshSession())) {
      onProgress(0)
      result = await send()
    }
    if (result.status < 200 || result.status >= 300) {
      const detail = (result.body as { detail?: unknown }).detail
      throw new ApiError(result.status, typeof detail === 'string' ? detail : 'The upload failed')
    }
    return result.body as T
  })()
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${parseFloat((bytes / 1024 ** i).toFixed(1))} ${units[i]}`
}
