import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mic,
  Square,
  Play,
  BookOpen,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  Upload,
  RotateCcw,
  Volume2,
  FileAudio,
  Info,
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CopyButton } from '@/components/CopyButton'
import { ApiError, runAndWait } from '@/lib/api'

type Phase = 'idle' | 'recording' | 'transcribing' | 'done'
type PlaygroundMode = 'voice' | 'upload'

export function WhisperPlaygroundPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [mode, setMode] = useState<PlaygroundMode>('voice')
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<number | null>(null)

  const isSecureOrLocal =
    typeof window !== 'undefined' &&
    (window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')

  useEffect(() => () => stopTimer(), [])

  function stopTimer() {
    if (timer.current !== null) window.clearInterval(timer.current)
    timer.current = null
  }

  function fail(err: unknown, fallback: string) {
    if (err instanceof ApiError) {
      if (err.status === 503 || err.message.includes('not working') || err.message.includes('offline')) {
        setError(
          'Model gateway is offline or unreachable. Ensure the gateway service is running on port 8003 or check model tunnels in Admin.',
        )
      } else {
        setError(err.message)
      }
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

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        'Microphone access is unavailable in this browser context (browsers block live mic on HTTP IP addresses). Please use the "Upload Audio File" or "Text Format" tab to test.',
      )
      return
    }

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
      fail(
        err,
        'Microphone permission was denied. Allow mic permissions in your browser or switch to "Upload Audio".',
      )
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
      setError('Recording was too short. Speak a little longer (at least 1-2 seconds).')
      setPhase('idle')
      return
    }

    setPhase('transcribing')
    setNotice('Transcribing…')

    try {
      const base64Audio = await blobToBase64(blob)
      const rawText = await runAndWait(
        'whisperflow',
        'transcribe',
        { audio_base64: base64Audio },
        (msg) => setNotice(msg),
      )

      if (!rawText.trim()) {
        setError('No words were recognized. Try speaking closer to the microphone.')
        setPhase('idle')
        setNotice('')
        return
      }

      setTranscript(rawText)
      setResult(rawText)
      setPhase('done')
      setNotice('')
    } catch (err) {
      fail(err, 'The model gateway is currently unreachable. Check model tunnels in Admin.')
    }
  }

  async function handleAudioFileUpload(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      setUploadedFile(null)
      setError('Audio files must be 2 MB or smaller.')
      setPhase('idle')
      setNotice('')
      return
    }
    setUploadedFile(file)
    setError('')
    setNotice('Reading audio file…')
    setResult('')
    setTranscript('')
    setPhase('transcribing')

    try {
      const base64Audio = await blobToBase64(file)
      setNotice('Transcribing…')

      const rawText = await runAndWait(
        'whisperflow',
        'transcribe',
        { audio_base64: base64Audio },
        (msg) => setNotice(msg),
      )

      if (!rawText.trim()) {
        setError('No speech was detected in the uploaded audio file.')
        setPhase('idle')
        setNotice('')
        return
      }

      setTranscript(rawText)
      setResult(rawText)
      setPhase('done')
      setNotice('')
    } catch (err) {
      fail(err, 'Audio transcription failed. Make sure the speech gateway is running.')
    }
  }

  function reset() {
    setPhase('idle')
    setTranscript('')
    setResult('')
    setError('')
    setNotice('')
    setSeconds(0)
    setUploadedFile(null)
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-navy-border pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-green/30 bg-green-tint px-3 py-1 text-xs font-semibold text-green">
              <Play className="h-3.5 w-3.5 text-green" />
              <span>Interactive Testbench</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              WhisperFlow Playground
            </h1>
            <p className="text-sm text-slate">
              Speak or upload audio. The words are written down.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/products/whisperflow"
              className="inline-flex items-center gap-1.5 rounded-xl border border-navy-border bg-light-navy px-3.5 py-2 text-xs font-medium text-white hover:border-green/40 hover:text-green transition-all"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Specs</span>
            </Link>
            <Link
              to="/products/whisperflow/docs"
              className="inline-flex items-center gap-1.5 rounded-xl border border-navy-border bg-light-navy px-3.5 py-2 text-xs font-medium text-white hover:border-green/40 hover:text-green transition-all"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Docs</span>
            </Link>
            <Link
              to="/products/whisperflow/download"
              className="inline-flex items-center gap-1.5 rounded-xl bg-green px-3.5 py-2 text-xs font-semibold text-ink hover:bg-green/90 transition-all shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Get Apps</span>
            </Link>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex flex-wrap gap-2 rounded-2xl border border-navy-border bg-navy/80 p-1.5">
          <button
            type="button"
            onClick={() => {
              setMode('voice')
              setError('')
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              mode === 'voice'
                ? 'bg-green-tint text-green border border-green/30 shadow-sm'
                : 'text-slate hover:text-white'
            }`}
          >
            <Mic className="h-4 w-4" />
            <span>Microphone Dictation</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('upload')
              setError('')
            }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
              mode === 'upload'
                ? 'bg-green-tint text-green border border-green/30 shadow-sm'
                : 'text-slate hover:text-white'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Upload Audio File</span>
          </button>

        </div>

        {/* Main Stage Panel */}
        <div className="rounded-3xl border border-navy-border bg-light-navy/40 p-6 sm:p-10 space-y-8 backdrop-blur-sm">
          {/* STAGE 1: VOICE MODE */}
          {mode === 'voice' && (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
              {!isSecureOrLocal && (
                <div className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-start gap-3 text-left">
                  <Info className="h-5 w-5 shrink-0 mt-0.5 text-amber-400" />
                  <div className="space-y-1">
                    <p className="font-semibold">Notice for HTTP Access</p>
                    <p className="text-amber-200/90 leading-relaxed">
                      Browsers restrict live microphone access when loaded over plain HTTP IP addresses. If your browser blocks the microphone, use the{' '}
                      <button
                        type="button"
                        onClick={() => setMode('upload')}
                        className="underline font-bold text-white hover:text-green"
                      >
                        Upload Audio File
                      </button>{' '}
                      tab or test on localhost / HTTPS.
                    </p>
                  </div>
                </div>
              )}

              {phase === 'recording' ? (
                <div className="space-y-4">
                  <div className="relative mx-auto flex h-32 w-32 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-red-500 text-white shadow-2xl transition-transform active:scale-95"
                      title="Stop recording"
                    >
                      <Square className="h-8 w-8 fill-current" />
                    </button>
                  </div>
                  <div>
                    <div className="font-mono text-2xl font-bold text-red-400">
                      Recording: {formatTimer(seconds)}
                    </div>
                    <p className="text-xs text-slate mt-1">Tap red button when finished speaking</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => void startRecording()}
                    disabled={phase === 'transcribing'}
                    className="group relative mx-auto flex h-32 w-32 items-center justify-center rounded-full border-2 border-green/40 bg-green-tint text-green shadow-xl transition-all hover:scale-105 hover:border-green hover:bg-green hover:text-ink active:scale-95 disabled:opacity-50"
                  >
                    <Mic className="h-12 w-12 transition-transform group-hover:scale-110" />
                  </button>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">Tap to Record Microphone</h3>
                    <p className="text-xs text-slate max-w-md mx-auto leading-relaxed">
                      Speak in Hindi, English, or mixed Hinglish. Try saying: "point 1 server stays at home, point 2 keyboard is for android"
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAGE 2: AUDIO FILE UPLOAD */}
          {mode === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-white">Upload Voice Audio File</label>
                <p className="text-xs text-slate mt-0.5">
                  Supports WAV, MP3, M4A, WebM, and OGG. Maximum size is 2 MB.
                </p>
              </div>

              <label
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-navy-border bg-navy/60 p-8 cursor-pointer hover:border-green/50 hover:bg-navy transition-all text-center"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer.files?.[0]
                  if (f) void handleAudioFileUpload(f)
                }}
              >
                <FileAudio className="h-10 w-10 text-green mb-2" />
                <span className="text-sm font-semibold text-white">
                  {uploadedFile ? uploadedFile.name : 'Choose an audio file or drag & drop'}
                </span>
                <span className="text-xs text-slate mt-1">WAV, MP3, M4A, WebM, OGG</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void handleAudioFileUpload(f)
                  }}
                  className="sr-only"
                />
              </label>

              {uploadedFile && (
                <div className="flex items-center justify-between rounded-xl border border-navy-border bg-navy p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4 text-green" />
                    <span className="font-semibold text-white truncate max-w-xs">{uploadedFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleAudioFileUpload(uploadedFile)}
                    disabled={phase === 'transcribing'}
                    className="rounded-lg bg-green px-3 py-1 text-xs font-semibold text-ink hover:bg-green/90 disabled:opacity-50"
                  >
                    Re-Transcribe
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pipeline Notice / Progress Indicator */}
          {notice && (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-green/30 bg-green-tint px-5 py-3.5 text-sm font-semibold text-green animate-pulse">
              <span className="h-2.5 w-2.5 rounded-full bg-green" />
              <span>{notice}</span>
            </div>
          )}

          {/* Error Message Box */}
          {error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5 text-sm text-red-300 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-bold text-red-200">Execution Notice</p>
                <p className="text-xs leading-relaxed text-red-300/90">{error}</p>
              </div>
            </div>
          )}

          {/* Result Output Card */}
          {result && (
            <div className="rounded-3xl border border-green/40 bg-navy p-6 sm:p-8 space-y-5 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-border/60 pb-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-green" />
                  <span className="text-sm font-bold text-white">Written text</span>
                  <span className="rounded-full bg-green/10 border border-green/30 px-2 py-0.5 text-[10px] font-semibold text-green uppercase">
                    Ready
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton text={result} label="Copy text" />
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-navy-border bg-light-navy px-3 py-1.5 text-xs font-medium text-slate hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Formatted Output Area */}
              <div className="whitespace-pre-wrap rounded-2xl border border-navy-border bg-light-navy/50 p-5 text-base sm:text-lg leading-relaxed text-white font-medium select-all">
                {result}
              </div>

              {/* Comparison With Raw Transcript */}
              {transcript && transcript !== result && (
                <div className="pt-3 border-t border-navy-border/60 space-y-1">
                  <span className="text-xs font-semibold text-slate uppercase tracking-wider">
                    Raw Audio Transcript:
                  </span>
                  <p className="text-xs text-light-slate italic font-mono bg-navy/60 p-3 rounded-xl border border-navy-border/60">
                    "{transcript}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
