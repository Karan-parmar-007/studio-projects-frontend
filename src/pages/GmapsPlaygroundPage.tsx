import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, BookOpen, Download, Loader2, Play, Search, Square, X } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { ApiError } from '@/lib/api'
import {
  downloadCsv,
  gmapsCities,
  gmapsQuota,
  gmapsStates,
  streamRun,
  type Company,
  type GmapsQuota,
} from '@/lib/gmaps'

const field =
  'w-full rounded-xl border border-navy-border bg-navy px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-slate/60 focus:border-green/50 disabled:opacity-60'
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate'

function messageOf(err: unknown, fallback: string): string {
  return err instanceof ApiError || err instanceof Error ? err.message : fallback
}

export function GmapsPlaygroundPage() {
  const [quota, setQuota] = useState<GmapsQuota | null>(null)
  const [states, setStates] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [pickedStates, setPickedStates] = useState<string[]>([])
  const [pickedCities, setPickedCities] = useState<string[]>([])
  const [term, setTerm] = useState('')
  const [limit, setLimit] = useState('')
  const [rows, setRows] = useState<Company[]>([])
  const [status, setStatus] = useState('Ready')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const [target, setTarget] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  function reloadQuota() {
    gmapsQuota().then(setQuota).catch(() => undefined)
  }

  useEffect(() => {
    Promise.all([gmapsQuota(), gmapsStates()])
      .then(([q, s]) => {
        setQuota(q)
        setStates(s)
      })
      .catch((err) => setError(messageOf(err, 'Could not load the Maps Scraper')))
    return () => abortRef.current?.abort()
  }, [])

  useEffect(() => {
    let live = true
    gmapsCities(pickedStates)
      .then((items) => {
        if (!live) return
        setCities(items)
        // Drop cities that are no longer in the chosen states.
        setPickedCities((current) => current.filter((city) => items.includes(city)))
      })
      .catch(() => live && setCities([]))
    return () => {
      live = false
    }
  }, [pickedStates])

  const remaining = quota?.remaining ?? 0
  const wanted = limit.trim() ? Number(limit) : null
  const limitBad = wanted !== null && (!Number.isInteger(wanted) || wanted < 1 || wanted > (quota?.limit ?? 50))
  const canStart = !running && term.trim().length > 0 && remaining > 0 && !limitBad

  async function start() {
    if (!canStart) return
    setError('')
    setNote('')
    setRows([])
    setTarget(null)
    setRunning(true)
    setStatus('Starting')
    const controller = new AbortController()
    abortRef.current = controller
    try {
      await streamRun(
        {
          search_term: term.trim(),
          countries: [],
          states: pickedStates,
          cities: pickedCities,
          ...(wanted ? { limit: wanted } : {}),
        },
        {
          onStarted: (data) => {
            setTarget(Number(data.limit) || null)
            setStatus('Searching')
          },
          onProgress: (data) => setStatus(String(data.status || 'Searching').replace(/_/g, ' ')),
          onCompany: (company) => setRows((current) => [...current, company]),
          onCompleted: (data) => {
            setStatus(String(data.status || 'completed'))
            setNote(String(data.message || ''))
          },
          onError: (message) => {
            setError(message)
            setStatus('stopped')
          },
        },
        controller.signal,
      )
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setError(messageOf(err, 'The search could not start'))
    } finally {
      setRunning(false)
      abortRef.current = null
      reloadQuota()
      // Unused companies are given back a moment after the stream closes.
      window.setTimeout(reloadQuota, 2500)
    }
  }

  function stop() {
    abortRef.current?.abort()
    setStatus('stopped')
    setNote('Stopped. Companies you did not receive are given back.')
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy-border pb-5">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Maps Scraper playground</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate">
              Search Google Maps for a kind of business in the United States. Companies appear here as they are found and are never saved.
            </p>
          </div>
          <Link
            to="/products/gmaps/docs"
            className="inline-flex items-center gap-1.5 rounded-full border border-navy-border bg-light-navy px-4 py-2 text-sm font-medium text-white hover:border-green/40"
          >
            <BookOpen className="h-4 w-4 text-green" />
            API docs
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-5">
            <div className="rounded-2xl border border-navy-border bg-light-navy p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate">Left today</p>
              <p className="mt-2 text-3xl font-semibold text-white">
                {quota ? remaining : '…'}
                <span className="ml-1 text-base font-normal text-slate">/ {quota?.limit ?? 50}</span>
              </p>
              <p className="mt-1 text-xs text-slate">
                Used {quota?.used ?? 0} · resets at midnight UTC · shared with your API key
              </p>
            </div>

            <div className="space-y-4 rounded-2xl border border-navy-border bg-light-navy p-5">
              <div>
                <label className={label} htmlFor="gmaps-term">
                  Business
                </label>
                <input
                  id="gmaps-term"
                  className={field}
                  value={term}
                  maxLength={200}
                  onChange={(event) => setTerm(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && void start()}
                  placeholder="dentist, plumber, IT company…"
                  disabled={running}
                />
              </div>

              <Picker label="States" options={states} picked={pickedStates} onChange={setPickedStates} disabled={running} />
              <Picker
                label="Cities"
                options={cities}
                picked={pickedCities}
                onChange={setPickedCities}
                disabled={running}
                hint={pickedStates.length ? undefined : 'Pick a state first to narrow the list'}
              />

              <div>
                <label className={label} htmlFor="gmaps-limit">
                  How many (optional)
                </label>
                <input
                  id="gmaps-limit"
                  className={field}
                  inputMode="numeric"
                  value={limit}
                  onChange={(event) => setLimit(event.target.value.replace(/[^\d]/g, '').slice(0, 2))}
                  placeholder={`Everything left (${remaining})`}
                  disabled={running}
                />
                {limitBad && <p className="mt-1 text-xs text-red-400">Pick a number from 1 to {quota?.limit ?? 50}.</p>}
              </div>

              <p className="text-xs leading-relaxed text-slate">
                Nothing picked means anywhere in the United States.
              </p>

              {error && (
                <p className="flex items-start gap-2 text-sm text-red-400">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void start()}
                  disabled={!canStart}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-green px-4 py-2.5 text-sm font-semibold text-ink hover:bg-green-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Start
                </button>
                <button
                  type="button"
                  onClick={stop}
                  disabled={!running}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-navy-border bg-navy px-4 py-2.5 text-sm font-medium text-white hover:border-green/40 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </button>
              </div>
            </div>
          </aside>

          <section className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy-border bg-light-navy px-5 py-4">
              <p className="text-sm text-slate">
                <span className="font-semibold capitalize text-white">{status}</span>
                {rows.length ? ` · ${rows.length} companies` : ''}
                {target ? ` of ${target}` : ''}
                {note ? ` · ${note}` : ''}
              </p>
              <button
                type="button"
                disabled={!rows.length}
                onClick={() => downloadCsv(rows, `maps-${term.trim().replace(/\W+/g, '-') || 'search'}-${Date.now()}.csv`)}
                className="inline-flex items-center gap-1.5 rounded-full border border-navy-border px-4 py-2 text-xs font-semibold text-white hover:border-green/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-4 w-4 text-green" />
                Download CSV
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-navy-border">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-navy-border bg-light-navy text-xs uppercase tracking-wider text-slate">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">City</th>
                      <th className="px-4 py-3">Website</th>
                      <th className="px-4 py-3">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-border">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-slate">
                          {running ? 'Searching… the first companies usually take a few seconds.' : 'No companies yet.'}
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, index) => (
                        <tr key={String(row.place_id || row.cid || index)} className="text-white">
                          <td className="px-4 py-3">{String(row.name || '—')}</td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-light-slate">{String(row.phone || '—')}</td>
                          <td className="px-4 py-3 text-light-slate">{String(row.city || '—')}</td>
                          <td className="max-w-[240px] truncate px-4 py-3 text-xs">
                            {typeof row.website === 'string' && /^https?:\/\//i.test(row.website) ? (
                              <a href={row.website} target="_blank" rel="noopener noreferrer nofollow" className="text-green hover:underline">
                                {row.website.replace(/^https?:\/\/(www\.)?/i, '')}
                              </a>
                            ) : (
                              <span className="text-slate">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-light-slate">{row.rating == null ? '—' : String(row.rating)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}

function Picker({
  label: title,
  options,
  picked,
  onChange,
  disabled,
  hint,
}: {
  label: string
  options: string[]
  picked: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
  hint?: string
}) {
  const [filter, setFilter] = useState('')
  const shown = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    return needle ? options.filter((option) => option.toLowerCase().includes(needle)) : options
  }, [options, filter])

  function toggle(value: string) {
    onChange(picked.includes(value) ? picked.filter((item) => item !== value) : [...picked, value])
  }

  return (
    <div>
      <span className={label}>
        {title}
        {picked.length ? ` (${picked.length})` : ''}
      </span>
      {picked.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {picked.map((value) => (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => toggle(value)}
              className="inline-flex items-center gap-1 rounded-full border border-green/30 bg-green-tint px-2.5 py-0.5 text-xs text-green disabled:opacity-60"
            >
              {value}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
      <div className="rounded-xl border border-navy-border bg-navy">
        <div className="flex items-center gap-2 border-b border-navy-border px-3 py-2">
          <Search className="h-3.5 w-3.5 text-slate" />
          <input
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate/60"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={`Filter ${title.toLowerCase()}`}
            disabled={disabled}
            aria-label={`Filter ${title.toLowerCase()}`}
          />
        </div>
        <div className="max-h-32 space-y-0.5 overflow-y-auto p-1.5">
          {shown.length === 0 ? (
            <p className="px-2 py-1 text-xs text-slate">{hint ?? 'Nothing matches'}</p>
          ) : (
            shown.map((option) => {
              const on = picked.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggle(option)}
                  className={`block w-full rounded-lg px-2.5 py-1 text-left text-xs transition ${
                    on ? 'bg-green-tint text-green' : 'text-light-slate hover:bg-light-navy hover:text-white'
                  } disabled:opacity-60`}
                >
                  {option}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
