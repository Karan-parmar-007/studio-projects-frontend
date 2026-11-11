// Shared with /home/karan/my_website/new_frontend/portfolio_frontend/src/components/chat: keep both copies in sync.
import { createContext, useContext, useId, useState } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Source } from './types'

const CITE = '#cite-'

/** "[2]" becomes a link to "#cite-2" so the renderer can draw a chip. Only known sources. */
function linkCitations(text: string, sources: Source[]): string {
  if (!sources.length) return text
  const known = new Set(sources.map((source) => source.n))
  return text.replace(/\[(\d{1,3})\](?![(:[])/g, (whole, digits: string) =>
    known.has(Number(digits)) ? `[${digits}](${CITE}${digits})` : whole,
  )
}

export function CitationChip({ source }: { source: Source }) {
  const [open, setOpen] = useState(false)
  const tipId = useId()
  return (
    <span className="relative inline-block align-super" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-describedby={open ? tipId : undefined}
        aria-label={`Source ${source.n}: ${source.heading || 'passage'}`}
        onClick={() => setOpen((value) => !value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key !== 'Escape' || !open) return
          event.stopPropagation()
          setOpen(false)
        }}
        className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded border border-green/40 bg-green-tint px-1 font-mono text-[10px] leading-none font-semibold text-green hover:bg-green/20"
      >
        {source.n}
      </button>
      {open && (
        <span
          id={tipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-1.5 block w-64 max-w-[70vw] -translate-x-1/2 rounded-xl border border-navy-border bg-light-navy p-3 text-left align-baseline text-xs leading-relaxed font-normal text-light-slate shadow-xl"
        >
          <span className="block font-semibold text-white">{source.heading || `Passage ${source.n}`}</span>
          <span className="mt-0.5 block text-[11px] text-slate">
            {[source.document, source.page != null ? `page ${source.page}` : ''].filter(Boolean).join(' · ')}
          </span>
          {source.snippet && <span className="mt-1.5 block">{source.snippet}</span>}
        </span>
      )}
    </span>
  )
}

const SourcesContext = createContext<Source[]>([])

function Cite({ n }: { n: number }) {
  const source = useContext(SourcesContext).find((item) => item.n === n)
  return source ? <CitationChip source={source} /> : <span>[{n}]</span>
}

// Stable across renders, so a chip keeps its open tooltip while tokens stream in.
const COMPONENTS: Components = {
  a: ({ href, children }) => {
    if (href?.startsWith(CITE)) return <Cite n={Number(href.slice(CITE.length))} />
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-green underline underline-offset-2 hover:opacity-80">
        {children}
      </a>
    )
  },
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  h1: ({ children }) => <h3 className="mt-3 mb-1.5 text-base font-semibold text-white">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-3 mb-1.5 text-base font-semibold text-white">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-3 mb-1 text-sm font-semibold text-white">{children}</h4>,
  h4: ({ children }) => <h4 className="mt-3 mb-1 text-sm font-semibold text-white">{children}</h4>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-green/50 pl-3 text-slate">{children}</blockquote>,
  hr: () => <hr className="my-3 border-navy-border" />,
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg border border-navy-border bg-navy p-3 font-mono text-xs">{children}</pre>
  ),
  code: ({ className, children }) => (
    <code className={className ? `${className} font-mono` : 'rounded bg-navy px-1 py-0.5 font-mono text-[0.85em] text-green'}>
      {children}
    </code>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="min-w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-navy-border bg-navy px-2 py-1 text-left font-semibold text-white">{children}</th>,
  td: ({ children }) => <td className="border border-navy-border px-2 py-1">{children}</td>,
  img: ({ alt }) => <span className="text-slate">{alt ? `[${alt}]` : ''}</span>,
}

/** Markdown answer text. No raw HTML; links open in a new tab; "[n]" becomes a source chip. */
const PLUGINS = [remarkGfm]
const NO_SOURCES: Source[] = []

export function Markdown({ text, sources = NO_SOURCES, className = '' }: { text: string; sources?: Source[]; className?: string }) {
  return (
    <SourcesContext.Provider value={sources}>
      <div className={`break-words ${className}`}>
        <ReactMarkdown remarkPlugins={PLUGINS} skipHtml components={COMPONENTS}>
          {linkCitations(text, sources)}
        </ReactMarkdown>
      </div>
    </SourcesContext.Provider>
  )
}
