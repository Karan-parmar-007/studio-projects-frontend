import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CopyButton } from '@/components/CopyButton'
import { Gate } from '@/components/Shell'
import { ApiError, api, downloadUrl, runAndWait, type DownloadItem, type Endpoint, type Project } from '@/lib/api'

const PROJECT = 'whisperflow'
const DESKTOP_LABELS: Record<string, string> = { windows: 'Windows', macos: 'macOS', linux: 'Linux' }

const appSteps = {
  desktop: [
    'Download the app for your computer and open it.',
    'Sign in, open the dashboard, and create an API key. Paste it into the app.',
    'Choose the keys that record and stop. In any app, record, speak, and stop. The text is pasted where you were typing.',
  ],
  android: [
    'Download the APK and install it. Allow the microphone.',
    'Turn on Studio Flow under Settings, System, Languages, On-screen keyboard, then switch to that keyboard.',
    'Paste your API key into the Studio Flow app. In any app, tap the mic, speak, and tap stop.',
  ],
}

const example = `{
  "text": "point 1 the server stays at home. point 2 the keyboard is for android.",
  "tone": "whatsapp",
  "script": "roman"
}`

function useProject() {
  const [project, setProject] = useState<Project | null>(null)
  useEffect(() => {
    api<Project>(`/projects/${PROJECT}`).then(setProject).catch(() => setProject(null))
  }, [])
  return project
}

function ProductTabs({ current }: { current: 'download' | 'playground' | 'overview' }) {
  const tabs = [
    ['/whisperflow-clone', 'Overview', current === 'overview'],
    ['/whisperflow-clone/download', 'Download', current === 'download'],
    ['/whisperflow-clone/playground', 'Playground and docs', current === 'playground'],
  ] as const
  return (
    <nav className="mt-6 flex gap-2 overflow-x-auto pb-1">
      {tabs.map(([href, label, active]) => (
        <Link
          key={href}
          to={href}
          className={`shrink-0 rounded border px-3 py-2 font-mono text-xs ${
            active ? 'border-green text-green' : 'border-navy-border text-light-slate hover:text-green'
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}

export function WhisperProductPage() {
  const project = useProject()
  return (
    <div>
      <p className="font-mono text-sm text-green">Product</p>
      <h1 className="mt-2 text-3xl font-bold text-lightest-slate sm:text-5xl">{project?.name ?? 'WhisperFlow'}</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate sm:text-lg">
        {project?.description ?? 'Speak, and the words land as clean text wherever you were typing.'}
      </p>
      <ProductTabs current="overview" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link to="/whisperflow-clone/download" className="rounded border border-navy-border bg-light-navy/70 p-6 hover:border-green/40">
          <p className="font-mono text-xs text-green">01</p>
          <h2 className="mt-3 text-2xl font-semibold text-lightest-slate">Download</h2>
          <p className="mt-2 text-sm leading-relaxed">The computer app and the Android keyboard. Both need only your API key.</p>
        </Link>
        <Link to="/whisperflow-clone/playground" className="rounded border border-navy-border bg-light-navy/70 p-6 hover:border-green/40">
          <p className="font-mono text-xs text-green">02</p>
          <h2 className="mt-3 text-2xl font-semibold text-lightest-slate">Playground and docs</h2>
          <p className="mt-2 text-sm leading-relaxed">Try a take in the browser, then call the same API from your own code.</p>
        </Link>
      </div>
    </div>
  )
}

export function WhisperDownloadPage() {
  return (
    <div>
      <p className="font-mono text-sm text-green">WhisperFlow</p>
      <h1 className="mt-2 text-3xl font-bold text-lightest-slate sm:text-4xl">Download</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
        The Android app is a keyboard. The computer app sits in the background and pastes with the keys you choose.
      </p>
      <ProductTabs current="download" />
      <div className="mt-8">
        <Apps />
      </div>
    </div>
  )
}

export function WhisperPlaygroundPage() {
  const project = useProject()
  return (
    <div>
      <p className="font-mono text-sm text-green">WhisperFlow</p>
      <h1 className="mt-2 text-3xl font-bold text-lightest-slate sm:text-4xl">Playground and docs</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed sm:text-base">
        Signed-in use in the browser needs no API key. Apps and your own code send the key.
      </p>
      <ProductTabs current="playground" />
      <section className="mt-8">
        <Gate>
          <Playground />
        </Gate>
      </section>
      <Docs endpoints={project?.endpoints ?? []} />
    </div>
  )
}

function Docs({ endpoints }: { endpoints: Endpoint[] }) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-semibold text-lightest-slate">Docs</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed">
        Send <span className="font-mono text-light-slate">Authorization: Bearer sk-studio_…</span>. A busy model answers 202 with a job to poll.
      </p>
      <div className="mt-5 grid gap-3">
        {endpoints.map((endpoint) => (
          <div key={endpoint.path} className="rounded border border-navy-border bg-light-navy p-4">
            <p className="break-all font-mono text-xs text-green sm:text-sm">
              {endpoint.method} {endpoint.path}
            </p>
            <p className="mt-2 text-sm">{endpoint.summary}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded border border-navy-border bg-light-navy p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="break-all font-mono text-xs text-green">POST /api/studio/v1/whisperflow/format</p>
          <CopyButton text={example} label="Copy example" />
        </div>
        <pre className="mt-4 overflow-x-auto font-mono text-xs leading-relaxed text-light-slate sm:text-sm">{`Authorization: Bearer sk-studio_...\n${example}`}</pre>
      </div>
    </section>
  )
}

type Phase = 'idle' | 'recording' | 'transcribing' | 'formatting'

function Playground() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [script, setScript] = useState<'roman' | 'devanagari'>('roman')
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [checks, setChecks] = useState<Array<Record<string, unknown>>>([])
  const [seconds, setSeconds] = useState(0)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<number | null>(null)

  useEffect(() => () => stopTimer(), [])

  function stopTimer() {
    if (timer.current !== null) window.clearInterval(timer.current)
    timer.current = null
  }

  function fail(err: unknown, fallback: string) {
    if (err instanceof ApiError) {
      setError(err.message)
      setChecks(err.checks)
    } else {
      setError(err instanceof Error ? err.message : fallback)
    }
    setNotice('')
    setPhase('idle')
  }

  async function startRecording() {
    setError('')
    setChecks([])
    setResult('')
    setTranscript('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const media = new MediaRecorder(stream)
      chunks.current = []
      media.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data)
      }
      media.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        void sendRecording(new Blob(chunks.current, { type: media.mimeType }))
      }
      media.start()
      recorder.current = media
      setSeconds(0)
      setPhase('recording')
      timer.current = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    } catch (err) {
      fail(err, 'The microphone is not available. Allow it in the browser and try again.')
    }
  }

  function stopRecording() {
    stopTimer()
    recorder.current?.stop()
    recorder.current = null
  }

  async function sendRecording(blob: Blob) {
    if (blob.size < 1000) {
      setError("Didn't catch that. Record a little longer.")
      setPhase('idle')
      return
    }
    setPhase('transcribing')
    setNotice('Transcribing…')
    try {
      const heard = await runAndWait(PROJECT, 'transcribe', { audio_base64: await toBase64(blob) }, setNotice)
      setTranscript(heard)
      if (!heard.trim()) {
        setError("Didn't catch any words.")
        setNotice('')
        setPhase('idle')
        return
      }
      await formatText(heard)
    } catch (err) {
      fail(err, 'Transcription failed')
    }
  }

  async function formatText(text: string) {
    setPhase('formatting')
    setNotice('Shaping the text…')
    try {
      const shaped = await runAndWait(PROJECT, 'format', { text, script, tone: 'plain' }, setNotice)
      setResult(shaped)
      setNotice('')
      setPhase('idle')
    } catch (err) {
      fail(err, 'The formatter did not answer')
    }
  }

  async function formatTyped(event: FormEvent) {
    event.preventDefault()
    setError('')
    setChecks([])
    setResult('')
    if (!transcript.trim()) return
    await formatText(transcript)
  }

  const busy = phase === 'transcribing' || phase === 'formatting'

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded border border-navy-border bg-light-navy/70 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          {phase === 'recording' ? (
            <button type="button" onClick={stopRecording} className="rounded border border-[#ff8b8b] px-6 py-3 font-mono text-sm text-[#ff8b8b] hover:bg-[#ff8b8b]/10">
              Stop · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void startRecording()}
              disabled={busy}
              className="rounded border border-green px-6 py-3 font-mono text-sm text-green hover:bg-green-tint disabled:opacity-50"
            >
              Record
            </button>
          )}
          <label className="flex items-center gap-2 font-mono text-xs text-light-slate">
            <input type="checkbox" checked={script === 'devanagari'} onChange={(event) => setScript(event.target.checked ? 'devanagari' : 'roman')} />
            Hindi in Devanagari
          </label>
        </div>
        <form onSubmit={formatTyped} className="mt-6 grid gap-3">
          <label className="font-mono text-xs text-slate">Transcript, or paste rough text</label>
          <textarea
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            rows={6}
            placeholder="point 1 the server stays at home. point 2 the keyboard is for android."
            className="w-full rounded border border-navy-border bg-navy px-3 py-3 text-base text-lightest-slate outline-none focus:border-green"
          />
          <button
            type="submit"
            disabled={busy || !transcript.trim()}
            className="w-full rounded border border-green px-4 py-3 font-mono text-sm text-green hover:bg-green-tint disabled:opacity-50 sm:w-fit"
          >
            Format this text
          </button>
        </form>
      </div>
      <div className="min-h-48 rounded border border-navy-border bg-light-navy/70 p-4 sm:p-6">
        <p className="font-mono text-xs text-slate">Result</p>
        {notice ? <p className="mt-3 font-mono text-sm text-green">{notice}</p> : null}
        {error ? <p className="mt-3 text-sm text-[#ff8b8b]">{error}</p> : null}
        {checks.length > 0 ? (
          <ul className="mt-2 font-mono text-xs text-slate">
            {checks.map((check, index) => (
              <li key={index} className="break-all">
                {String(check.role)} · {String(check.placement)} · {String(check.state)}
              </li>
            ))}
          </ul>
        ) : null}
        {result ? (
          <>
            <pre className="mt-3 whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-lightest-slate">{result}</pre>
            <div className="mt-4">
              <CopyButton text={result} />
            </div>
          </>
        ) : !notice && !error ? (
          <p className="mt-3 text-sm">Press Record, speak in Hindi, English, or Hinglish, then Stop.</p>
        ) : null}
      </div>
    </div>
  )
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the recording'))
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.readAsDataURL(blob)
  })
}

function mb(bytes: number): string {
  if (!bytes) return ''
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Apps() {
  const [items, setItems] = useState<DownloadItem[] | null>(null)

  useEffect(() => {
    api<DownloadItem[]>('/downloads')
      .then((all) => setItems(all.filter((item) => item.product === PROJECT)))
      .catch(() => setItems([]))
  }, [])

  const desktop = (items ?? []).filter((item) => item.platform !== 'android')
  const android = (items ?? []).find((item) => item.platform === 'android')

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded border border-navy-border bg-light-navy/70 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-lightest-slate">Computer</h2>
        <p className="mt-2 text-sm">Windows, macOS, and Linux.</p>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(['windows', 'macos', 'linux'] as const).map((platform) => {
            const item = desktop.find((entry) => entry.platform === platform)
            if (!item) {
              return (
                <span key={platform} className="rounded border border-navy-border px-4 py-3 text-center font-mono text-xs text-slate">
                  {DESKTOP_LABELS[platform]} · soon
                </span>
              )
            }
            return (
              <a key={platform} href={downloadUrl(PROJECT, platform)} className="rounded border border-green px-4 py-3 text-center font-mono text-xs text-green hover:bg-green-tint">
                <span className="block">{DESKTOP_LABELS[platform]}</span>
                <span className="mt-1 block text-[10px] text-light-slate">
                  {mb(item.size)}
                  {item.version ? ` · v${item.version}` : ''}
                </span>
              </a>
            )
          })}
        </div>
        <ol className="mt-6 grid gap-3">
          {appSteps.desktop.map((step, index) => (
            <li key={step} className="text-sm leading-relaxed">
              <span className="mr-2 font-mono text-green">0{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>
      <section className="rounded border border-navy-border bg-light-navy/70 p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-lightest-slate">Android</h2>
        <p className="mt-2 text-sm">Installs as a keyboard, the same way Gboard does.</p>
        {android ? (
          <a href={downloadUrl(PROJECT, 'android')} className="mt-5 inline-flex w-full flex-col rounded border border-green px-5 py-3 font-mono text-sm text-green hover:bg-green-tint sm:w-auto">
            <span>Download for Android</span>
            <span className="mt-1 text-[10px] text-light-slate">
              {mb(android.size)}
              {android.version ? ` · v${android.version}` : ''}
            </span>
          </a>
        ) : (
          <span className="mt-5 inline-flex rounded border border-navy-border px-5 py-3 font-mono text-sm text-slate">Android · soon</span>
        )}
        <ol className="mt-6 grid gap-3">
          {appSteps.android.map((step, index) => (
            <li key={step} className="text-sm leading-relaxed">
              <span className="mr-2 font-mono text-green">0{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
