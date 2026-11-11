// Shared with /home/karan/my_website/new_frontend/portfolio_frontend/src/components/chat: keep both copies in sync.
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Source } from './types'

/** The passages an answer used, folded by default. Each row matches a "[n]" chip in the text. */
export function SourceChips({ sources, defaultOpen = false }: { sources: Source[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  if (!sources.length) return null
  return (
    <div className="mt-2 text-xs">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 font-semibold text-slate hover:text-white"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
        Sources ({sources.length})
      </button>
      {open && (
        <ol className="mt-1.5 space-y-1.5">
          {sources.map((source) => (
            <li key={source.n} className="flex gap-2 rounded-lg border border-navy-border bg-navy/60 p-2">
              <span className="mt-0.5 inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded border border-green/40 bg-green-tint px-1 font-mono text-[10px] font-semibold text-green">
                {source.n}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-white">{source.heading || `Passage ${source.n}`}</span>
                <span className="block text-[11px] text-slate">
                  {[source.document, source.page != null ? `page ${source.page}` : '', source.kind && source.kind !== 'text' ? source.kind : '']
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                {source.snippet && <span className="mt-0.5 block leading-relaxed text-light-slate">{source.snippet}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
