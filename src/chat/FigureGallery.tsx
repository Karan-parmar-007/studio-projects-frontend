// Shared with /home/karan/my_website/new_frontend/portfolio_frontend/src/components/chat: keep both copies in sync.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { tone } from './site'
import type { Figure } from './types'

function Lightbox({ figure, onClose }: { figure: Figure; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      before?.focus()
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={figure.label}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <figure className="flex max-h-full max-w-4xl flex-col gap-3" onClick={(event) => event.stopPropagation()}>
        <img src={figure.url} alt={figure.caption || figure.label} className={`max-h-[75vh] w-auto rounded-lg object-contain ${tone.figureBg}`} />
        <figcaption className={`flex items-start justify-between gap-4 text-sm ${tone.onDark}`}>
          <span>
            <strong>{figure.label}</strong>
            {figure.page != null ? ` · page ${figure.page}` : ''}
            {figure.caption ? <span className="mt-1 block text-xs opacity-80">{figure.caption}</span> : null}
          </span>
          <span className="flex shrink-0 gap-2">
            <a
              href={figure.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-current px-3 py-1 text-xs hover:opacity-80"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              New tab
            </a>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close figure"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-current hover:opacity-80"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </span>
        </figcaption>
      </figure>
    </div>
  )
}

/** Figures shown under an answer. Click opens a larger view. Links expire after 15 minutes. */
export function FigureGallery({ figures }: { figures: Figure[] }) {
  const [shown, setShown] = useState<Figure | null>(null)
  const [broken, setBroken] = useState<Record<string, boolean>>({})
  const close = useCallback(() => setShown(null), [])
  if (!figures.length) return null
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-semibold text-slate">Figures</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {figures.map((figure) => (
          <li key={figure.id}>
            <button
              type="button"
              onClick={() => setShown(figure)}
              className="group block w-full overflow-hidden rounded-lg border border-navy-border bg-navy text-left hover:border-green/40"
              aria-label={`Open ${figure.label}${figure.caption ? `: ${figure.caption}` : ''}`}
            >
              {broken[figure.id] ? (
                <span className="flex aspect-[4/3] items-center justify-center p-2 text-center text-[11px] text-slate">
                  Link expired. Ask again to see it.
                </span>
              ) : (
                <img
                  src={figure.url}
                  alt={figure.caption || figure.label}
                  loading="lazy"
                  width={figure.width ?? undefined}
                  height={figure.height ?? undefined}
                  onError={() => setBroken((current) => ({ ...current, [figure.id]: true }))}
                  className={`aspect-[4/3] w-full object-contain ${tone.figureBg}`}
                />
              )}
              <span className="block truncate px-2 py-1 text-[11px] text-light-slate">
                {figure.label}
                {figure.page != null ? ` · p. ${figure.page}` : ''}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {shown && <Lightbox figure={shown} onClose={close} />}
    </div>
  )
}
