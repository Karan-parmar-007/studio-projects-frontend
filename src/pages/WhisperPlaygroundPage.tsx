import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mic,
  Square,
  Play,
  Sparkles,
  BookOpen,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CopyButton } from '@/components/CopyButton'
import { ApiError, runAndWait } from '@/lib/api'

type Phase = 'idle' | 'recording' | 'transcribing' | 'formatting' | 'done'

export function WhisperPlaygroundPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [mode, setMode] = useState<'voice' | 'text'>('voice')
  const [script, setScript] = useState<'roman' | 'devanagari'>('roman')
  const [tone, setTone] = useState<'whatsapp' | 'work' | 'points'>('whatsapp')
  const [inputText, setInputText] = useState('point 1 server ghar pe rahega point 2 keyboard android ke liye hai')
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
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
    } else {
      setError(err instanceof Error ? err.message : fallback)
    }
    setNotice('')
    setPhase('idle')
  }

  async function startRecording() {
    setError('')
    setNotice('')
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
      timer.current = window.setInterval(() => setSeconds((val) => val + 1), 1000)
    } catch (err) {
      fail(err, 'Microphone permission denied. Allow mic access in your browser.')
    }
  }

  function stopRecording() {
    stopTimer()
    recorder.current?.stop()
    recorder.current = null
  }

  async function blobToBase64(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  async function sendRecording(blob: Blob) {
    if (blob.size < 800) {
      setError('Recording was too short. Speak a little longer.')
      setPhase('idle')
      return
    }

    setPhase('transcribing')
    setNotice('Transcribing with Tara on local RTX 3060…')

    try {
      const base64Audio = await blobToBase64(blob)
      const rawText = await runAndWait(
        'whisperflow',
        'transcribe',
        { audio_base64: base64Audio },
        (msg) => setNotice(msg),
      )

      if (!rawText.trim()) {
        setError('No words recognized. Try speaking closer to the mic.')
        setPhase('idle')
        setNotice('')
        return
      }

      setTranscript(rawText)
      setPhase('formatting')
      setNotice('Formatting with Qwen 2.5 7B…')

      const formatted = await runAndWait(
        'whisperflow',
        'format',
        { text: rawText, tone, script },
        (msg) => setNotice(msg),
      )

      setResult(formatted)
      setPhase('done')
      setNotice('')
    } catch (err) {
      fail(err, 'The app is currently not working. Check model links in Admin.')
    }
  }

  async function formatTextInput() {
    if (!inputText.trim()) return
    setError('')
    setNotice('Formatting with Qwen 2.5 7B…')
    setPhase('formatting')
    setResult('')

    try {
      const formatted = await runAndWait(
        'whisperflow',
        'format',
        { text: inputText, tone, script },
        (msg) => setNotice(msg),
      )
      setResult(formatted)
      setTranscript(inputText)
      setPhase('done')
      setNotice('')
    } catch (err) {
      fail(err, 'Formatting request failed.')
    }
  }

  function reset() {
    setPhase('idle')
    setTranscript('')
    setResult('')
    setError('')
    setNotice('')
    setSeconds(0)
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-navy-border/60 pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-slate">
            <Link to="/dashboard" className="hover:text-green">Dashboard</Link>
            <span>/</span>
            <Link to="/products/whisperflow" className="hover:text-green">WhisperFlow</Link>
            <span>/</span>
            <span className="text-green font-medium">Playground</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/products/whisperflow"
              className="inline-flex items-center gap-1.5 rounded-md border border-navy-border bg-light-navy/50 px-3 py-1.5 font-mono text-xs text-light-slate hover:border-green/40 hover:text-green"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Project Details</span>
            </Link>
            <Link
              to="/products/whisperflow/docs"
              className="inline-flex items-center gap-1.5 rounded-md border border-navy-border bg-light-navy/50 px-3 py-1.5 font-mono text-xs text-light-slate hover:border-green/40 hover:text-green"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>API Reference</span>
            </Link>
            <Link
              to="/products/whisperflow/download"
              className="inline-flex items-center gap-1.5 rounded-md bg-green px-3 py-1.5 font-mono text-xs font-semibold text-navy hover:bg-green/90"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </Link>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-green/30 bg-green-tint px-3 py-1 font-mono text-xs text-green">
              <Play className="h-3.5 w-3.5 text-green" />
              <span>Interactive Testbench</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-lightest-slate sm:text-4xl">
              WhisperFlow Playground
            </h1>
            <p className="mt-1 text-sm text-slate">
              Try dictation directly in your browser. Signed-in sessions use your active SSO account.
            </p>
          </div>

          {/* Mode Switcher: Voice vs Text */}
          <div className="flex items-center rounded-xl border border-navy-border bg-navy/80 p-1">
            <button
              type="button"
              onClick={() => setMode('voice')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-mono text-xs font-semibold transition-all ${
                mode === 'voice'
                  ? 'bg-green-tint text-green border border-green/30'
                  : 'text-slate hover:text-light-slate'
              }`}
            >
              <Mic className="h-3.5 w-3.5" />
              <span>Microphone</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-mono text-xs font-semibold transition-all ${
                mode === 'text'
                  ? 'bg-green-tint text-green border border-green/30'
                  : 'text-slate hover:text-light-slate'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Text Format</span>
            </button>
          </div>
        </div>

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl border border-navy-border bg-light-navy/50 p-4 sm:p-5">
          {/* Script Selection */}
          <div>
            <label className="font-mono text-xs font-semibold text-lightest-slate">Output Script</label>
            <p className="text-[11px] text-slate mt-0.5 mb-2">How Hindi words should appear in text</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScript('roman')}
                className={`rounded-lg px-3 py-2 font-mono text-xs text-left transition-all ${
                  script === 'roman'
                    ? 'border border-green/40 bg-green-tint text-green font-medium'
                    : 'border border-navy-border bg-navy/60 text-slate hover:text-light-slate'
                }`}
              >
                <div>Roman Hinglish</div>
                <div className="text-[10px] text-slate font-normal">e.g. namaste dosto</div>
              </button>
              <button
                type="button"
                onClick={() => setScript('devanagari')}
                className={`rounded-lg px-3 py-2 font-mono text-xs text-left transition-all ${
                  script === 'devanagari'
                    ? 'border border-green/40 bg-green-tint text-green font-medium'
                    : 'border border-navy-border bg-navy/60 text-slate hover:text-light-slate'
                }`}
              >
                <div>Devanagari</div>
                <div className="text-[10px] text-slate font-normal">e.g. नमस्ते दोस्तों</div>
              </button>
            </div>
          </div>

          {/* Tone Selection */}
          <div>
            <label className="font-mono text-xs font-semibold text-lightest-slate">Formatting Tone</label>
            <p className="text-[11px] text-slate mt-0.5 mb-2">How punctuation and lists are styled</p>
            <div className="grid grid-cols-3 gap-2">
              {(['whatsapp', 'work', 'points'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTone(t)}
                  className={`rounded-lg px-3 py-2 font-mono text-xs capitalize text-center transition-all ${
                    tone === t
                      ? 'border border-green/40 bg-green-tint text-green font-medium'
                      : 'border border-navy-border bg-navy/60 text-slate hover:text-light-slate'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Interactive Stage */}
        <div className="rounded-3xl border border-navy-border/80 bg-light-navy/30 p-6 sm:p-10 space-y-8">
          {mode === 'voice' ? (
            /* Voice Mode Stage */
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
              {phase === 'recording' ? (
                <div className="space-y-4">
                  <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-red-500 text-white shadow-2xl transition-transform active:scale-95"
                    >
                      <Square className="h-8 w-8 fill-current" />
                    </button>
                  </div>
                  <div>
                    <div className="font-mono text-xl font-bold text-red-400">
                      Recording: {formatTimer(seconds)}
                    </div>
                    <p className="text-xs text-slate mt-1">Tap stop when finished speaking</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => void startRecording()}
                    disabled={phase === 'transcribing' || phase === 'formatting'}
                    className="group relative mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 border-green/40 bg-green-tint text-green shadow-xl transition-all hover:scale-105 hover:border-green hover:bg-green hover:text-navy active:scale-95 disabled:opacity-50"
                  >
                    <Mic className="h-10 w-10 transition-transform group-hover:scale-110" />
                  </button>
                  <div>
                    <h3 className="text-lg font-bold text-lightest-slate">Tap to Record Audio</h3>
                    <p className="text-xs text-slate mt-1">
                      Speak in Hindi, English, or mixed Hinglish. Try numbering points: "point 1, point 2..."
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Text Input Mode Stage */
            <div className="space-y-4">
              <label className="font-mono text-xs font-semibold text-lightest-slate">
                Enter Raw Speech Transcript
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-navy-border bg-navy px-4 py-3 font-mono text-xs text-lightest-slate outline-none focus:border-green"
                placeholder="e.g. point 1 server ghar pe rahega point 2 keyboard android ke liye hai"
              />
              <button
                type="button"
                onClick={() => void formatTextInput()}
                disabled={phase === 'formatting'}
                className="inline-flex items-center gap-2 rounded-xl bg-green px-5 py-2.5 font-mono text-xs font-semibold text-navy hover:bg-green/90 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>Format Text with Qwen</span>
              </button>
            </div>
          )}

          {/* Status Message / Pipeline Progress */}
          {notice && (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-green/30 bg-green-tint px-4 py-3 font-mono text-xs text-green animate-pulse">
              <span className="h-2 w-2 rounded-full bg-green" />
              <span>{notice}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-[#ff8b8b]/40 bg-[#ff8b8b]/10 p-4 text-xs text-[#ff8b8b]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Pipeline Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Result Output Card */}
          {result && (
            <div className="rounded-2xl border border-green/30 bg-navy/90 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green" />
                  <span className="font-mono text-xs font-semibold text-green">Formatted Result</span>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton text={result} label="Copy Output" />
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-md border border-navy-border px-2.5 py-1.5 font-mono text-xs text-slate hover:text-white"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="whitespace-pre-wrap rounded-xl border border-navy-border bg-light-navy/40 p-4 font-mono text-sm leading-relaxed text-lightest-slate">
                {result}
              </div>

              {transcript && transcript !== result && (
                <div className="pt-2 border-t border-navy-border/60">
                  <span className="font-mono text-[11px] text-slate">Raw Audio Transcript:</span>
                  <p className="mt-1 font-mono text-xs text-light-slate italic">"{transcript}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
