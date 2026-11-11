// Shared with /home/karan/my_website/new_frontend/portfolio_frontend/src/components/chat: keep both copies in sync.

/** One cited passage. `n` is the number the answer uses, as in "[2]". */
export type Source = {
  n: number
  heading: string
  page: number | null
  kind: string
  snippet: string
  document: string
}

/** A picture from the document. `url` is a same-origin path, valid for 15 minutes. */
export type Figure = {
  id: string
  url: string
  label: string
  caption: string
  page: number | null
  width: number | null
  height: number | null
}

export type GmapsRun = {
  search_term: string
  countries: string[]
  states: string[]
  cities: string[]
  limit: number | null
}

/** A Maps Scraper search the assistant prepared. It only runs when the person presses Run. */
export type GmapsAction = {
  kind: 'gmaps_run'
  run: GmapsRun
  summary: string
  remaining: number
  surface: 'studio' | 'portfolio'
  open_url: string
}

export type Stage = 'searching' | 'writing'

export type StreamEvent =
  | { type: 'status'; data: { stage: Stage; ahead: number } }
  | { type: 'sources'; data: { sources: Source[]; figures: Figure[] } }
  | { type: 'token'; data: { text: string } }
  | { type: 'tool'; data: { name: string; status: string } }
  | { type: 'action'; data: GmapsAction }
  | { type: 'done'; data: { cached: boolean; found: boolean } }
  | { type: 'error'; data: { message: string; code: string } }

export type AnswerError = {
  message: string
  /** "sign_in", "forbidden", "busy", "quota_exceeded", "service_off", "model_offline", ... */
  code: string
  /** HTTP status when the request was refused before streaming. */
  status?: number
}

/** Everything one streamed answer has produced so far. */
export type Answer = {
  text: string
  sources: Source[]
  figures: Figure[]
  stage: Stage | null
  ahead: number
  tools: string[]
  actions: GmapsAction[]
  error: AnswerError | null
  done: boolean
  cached: boolean
  found: boolean | null
  stopped: boolean
}

export type Turn = { role: 'user' | 'assistant'; content: string }

/** GET /chatbot/config */
export type ChatConfig = {
  enabled: boolean
  access: 'everyone' | 'signed_in' | 'roles'
  signed_in: boolean
  can_use: boolean
  reason: string
  greeting: string
  suggestions: string[]
  tools: boolean
  knowledge_ready: boolean
  studio_url: string
}
