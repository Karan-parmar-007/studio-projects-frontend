// Shared with /home/karan/my_website/new_frontend/portfolio_frontend/src/components/chat: keep both copies in sync.
import { useNavigate } from 'react-router-dom'
import { ExternalLink, MapPin, Play } from 'lucide-react'
import { SURFACE, studioPath, tone } from './site'
import type { GmapsAction, GmapsRun } from './types'

/** The playground reads these: ?q=&states=&cities=&limit=&autorun=1 (states/cities repeat). */
export function gmapsQuery(run: GmapsRun, autorun = true): string {
  const params = new URLSearchParams()
  params.set('q', run.search_term)
  for (const state of run.states ?? []) params.append('states', state)
  for (const city of run.cities ?? []) params.append('cities', city)
  if (run.limit) params.set('limit', String(run.limit))
  if (autorun) params.set('autorun', '1')
  return params.toString()
}

/**
 * A Maps Scraper search the assistant prepared. Nothing runs until the person confirms:
 * in Studio, Run opens the playground and starts it; elsewhere it links to Studio.
 */
export function GmapsActionCard({ action, onRun }: { action: GmapsAction; onRun?: () => void }) {
  const navigate = useNavigate()
  const href = studioPath(action.open_url, gmapsQuery(action.run))
  const here = SURFACE === 'studio' && action.surface === 'studio'
  const button = `inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ${tone.solid}`

  return (
    <div className="mt-2 rounded-xl border border-green/30 bg-green-tint p-3 text-xs">
      <p className="flex items-start gap-2 text-white">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green" aria-hidden="true" />
        <span>{action.summary}</span>
      </p>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-slate">{action.remaining} left today</span>
        {here ? (
          <button
            type="button"
            className={button}
            onClick={() => {
              onRun?.()
              navigate(href)
            }}
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            Run
          </button>
        ) : (
          <a href={href} target="_blank" rel="noopener noreferrer" className={button}>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Open in Studio
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        )}
      </div>
    </div>
  )
}
