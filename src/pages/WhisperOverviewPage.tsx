import { useState } from 'react'
import { Link } from 'react-router-dom'
import { downloadUrl } from '@/lib/api'
import {
  Radio,
  Play,
  BookOpen,
  Download,
  Cpu,
  Shield,
  Layers,
  ArrowRight,
  Terminal,
  Smartphone,
  Laptop,
  Sparkles,
  Zap,
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CopyButton } from '@/components/CopyButton'

const curlQuickExample = `curl -X POST "https://studio.karanparmar.in/api/studio/v1/whisperflow/format" \\
  -H "Authorization: Bearer sk-studio_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "point 1 server stays at home point 2 keyboard is for android",
    "tone": "whatsapp",
    "script": "roman"
  }'`

export function WhisperOverviewPage() {
  const [activeTab, setActiveTab] = useState<'desktop' | 'android'>('desktop')

  return (
    <DashboardLayout>
      <div className="space-y-12">
        {/* Breadcrumb & Navigation Pill */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-navy-border/60 pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-slate">
            <Link to="/dashboard" className="hover:text-green">Dashboard</Link>
            <span>/</span>
            <span className="text-light-slate">Products</span>
            <span>/</span>
            <span className="text-green font-medium">WhisperFlow</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/products/whisperflow/docs"
              className="inline-flex items-center gap-1.5 rounded-md border border-navy-border bg-light-navy/50 px-3 py-1.5 font-mono text-xs text-light-slate hover:border-green/40 hover:text-green"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Docs & API</span>
            </Link>
            <Link
              to="/products/whisperflow/playground"
              className="inline-flex items-center gap-1.5 rounded-md border border-navy-border bg-light-navy/50 px-3 py-1.5 font-mono text-xs text-light-slate hover:border-green/40 hover:text-green"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Playground</span>
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

        {/* Hero Section */}
        <div className="relative rounded-3xl border border-navy-border/80 bg-gradient-to-b from-light-navy/70 via-light-navy/30 to-navy p-8 sm:p-12 backdrop-blur-md overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-green/5 blur-3xl pointer-events-none" />

          <div className="relative max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-green/30 bg-green-tint px-3 py-1 font-mono text-xs text-green">
              <Radio className="h-3.5 w-3.5 text-green" />
              <span>WhisperFlow · Production v1.0</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-lightest-slate sm:text-5xl leading-tight">
              Private, Low-Latency Voice Dictation for Any Text Field.
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-slate">
              A self-hosted speech intelligence pipeline for Hindi, English, and Hinglish. Faster-whisper transcribes on your local RTX 3060, Qwen 2.5 7B structures your thought into Roman or Devanagari script, and native client apps type it into any application.
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Link
                to="/products/whisperflow/playground"
                className="inline-flex items-center gap-2 rounded-xl bg-green px-6 py-3 font-mono text-xs font-semibold text-navy hover:bg-green/90 transition-all active:scale-95 shadow-lg shadow-green/20"
              >
                <span>Launch Interactive Playground</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#downloads"
                className="inline-flex items-center gap-2 rounded-xl border border-navy-border bg-light-navy/60 px-5 py-3 font-mono text-xs text-light-slate hover:border-green/40 hover:text-green transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Get Apps</span>
              </a>
            </div>
          </div>

          {/* Badges strip */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-navy-border/60">
            <div>
              <p className="font-mono text-[11px] text-slate">Speech Model</p>
              <p className="mt-1 text-sm font-semibold text-lightest-slate">Tara CT2 (faster-whisper)</p>
            </div>
            <div>
              <p className="font-mono text-[11px] text-slate">LLM Formatter</p>
              <p className="mt-1 text-sm font-semibold text-lightest-slate">Qwen 2.5 7B Instruct</p>
            </div>
            <div>
              <p className="font-mono text-[11px] text-slate">Languages</p>
              <p className="mt-1 text-sm font-semibold text-lightest-slate">Hindi · English · Hinglish</p>
            </div>
            <div>
              <p className="font-mono text-[11px] text-slate">Privacy</p>
              <p className="mt-1 text-sm font-semibold text-green">100% Self-Hosted</p>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <section className="space-y-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-green">Architecture</p>
            <h2 className="mt-1 text-2xl font-bold text-lightest-slate">How WhisperFlow Works</h2>
            <p className="mt-1 text-sm text-slate">
              Engineered for instantaneous response times, maximum accuracy, and zero cloud dependency.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-navy-border bg-light-navy/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-green font-semibold">01 / CAPTURE</span>
                <Laptop className="h-4 w-4 text-light-slate" />
              </div>
              <h3 className="text-base font-bold text-lightest-slate">Native App Trigger</h3>
              <p className="text-xs leading-relaxed text-slate">
                Press your custom hotkey on Windows/Linux or tap the floating bubble on Android. Raw 16kHz audio is buffered locally.
              </p>
            </div>

            <div className="rounded-2xl border border-navy-border bg-light-navy/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-green font-semibold">02 / SPEECH RECOGNITION</span>
                <Cpu className="h-4 w-4 text-light-slate" />
              </div>
              <h3 className="text-base font-bold text-lightest-slate">Local GPU Tara STT</h3>
              <p className="text-xs leading-relaxed text-slate">
                Studio backend relays audio via your private tunnel directly to Tara CT2 on your RTX 3060. Zero remote fallback for speech.
              </p>
            </div>

            <div className="rounded-2xl border border-navy-border bg-light-navy/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-green font-semibold">03 / LLM STRUCTURING</span>
                <Sparkles className="h-4 w-4 text-light-slate" />
              </div>
              <h3 className="text-base font-bold text-lightest-slate">Smart Formatting</h3>
              <p className="text-xs leading-relaxed text-slate">
                Qwen 2.5 7B structures sentences, extracts numbered points, and applies Roman Hinglish or Devanagari script shaping.
              </p>
            </div>

            <div className="rounded-2xl border border-navy-border bg-light-navy/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-green font-semibold">04 / INSERTS ANYWHERE</span>
                <Zap className="h-4 w-4 text-light-slate" />
              </div>
              <h3 className="text-base font-bold text-lightest-slate">Instant Typing</h3>
              <p className="text-xs leading-relaxed text-slate">
                The formatted text is instantly simulated as keystrokes or written into the focused Android text box, without stealing focus.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section className="space-y-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-green">Capabilities</p>
            <h2 className="mt-1 text-2xl font-bold text-lightest-slate">Core Features</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-xl border border-navy-border bg-light-navy/30 p-6 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-green/30 bg-green-tint text-green">
                <Shield className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-lightest-slate">Zero Cloud Telemetry</h3>
              <p className="text-xs leading-relaxed text-slate">
                Audio is processed on your local GPU. The backend stores no voice logs, retaining absolute privacy.
              </p>
            </div>

            <div className="rounded-xl border border-navy-border bg-light-navy/30 p-6 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-green/30 bg-green-tint text-green">
                <Radio className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-lightest-slate">Roman Hinglish & Devanagari</h3>
              <p className="text-xs leading-relaxed text-slate">
                Natural transliteration designed for chat and tech workflows. Speaks Hindi? Reads in natural Latin or Devanagari.
              </p>
            </div>

            <div className="rounded-xl border border-navy-border bg-light-navy/30 p-6 space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-green/30 bg-green-tint text-green">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-lightest-slate">Deterministic Point Lists</h3>
              <p className="text-xs leading-relaxed text-slate">
                Say "point 1 server point 2 client" and receive cleanly formatted numbered items ready for notes and messages.
              </p>
            </div>
          </div>
        </section>

        {/* Downloads & Client Apps Section */}
        <section id="downloads" className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-green">Client Apps</p>
              <h2 className="mt-1 text-2xl font-bold text-lightest-slate">Download WhisperFlow</h2>
              <p className="mt-1 text-sm text-slate">
                Both client apps use the single API key generated in your Studio account.
              </p>
            </div>
          </div>

          {/* Platform Switcher */}
          <div className="flex gap-2 border-b border-navy-border/60 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('desktop')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-xs font-semibold transition-all ${
                activeTab === 'desktop'
                  ? 'bg-green/10 text-green border border-green/30'
                  : 'text-slate hover:text-white'
              }`}
            >
              <Laptop className="h-4 w-4" />
              <span>Desktop (Windows / Linux)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-xs font-semibold transition-all ${
                activeTab === 'android'
                  ? 'bg-green/10 text-green border border-green/30'
                  : 'text-slate hover:text-white'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>Android Bubble (APK)</span>
            </button>
          </div>

          {activeTab === 'desktop' ? (
            <div className="rounded-2xl border border-navy-border bg-light-navy/50 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-lightest-slate">StudioFlow Desktop App</h3>
                  <p className="mt-1 text-xs text-slate">
                    Background hotkey client with customizable chords, microphone capture, and direct simulated typing.
                  </p>
                </div>
                <a
                  href={downloadUrl('whisperflow', 'windows')}
                  className="inline-flex items-center gap-2 rounded-lg bg-green px-5 py-2.5 font-mono text-xs font-semibold text-navy hover:bg-green/90"
                >
                  <Download className="h-4 w-4" />
                  <span>Download for Windows</span>
                </a>
              </div>

              <div className="space-y-3 pt-4 border-t border-navy-border/60">
                <h4 className="font-mono text-xs font-semibold text-green">Setup Instructions:</h4>
                <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed text-slate pl-2">
                  <li>Download the app for your computer. macOS and Linux builds are on the <Link to="/whisperflow-clone/download" className="text-green underline">download page</Link>.</li>
                  <li>Copy your Studio API key from the <Link to="/keys" className="text-green underline">API Keys</Link> page.</li>
                  <li>Open StudioFlow, paste your API key, and choose your record and stop shortcuts. Nothing else to install.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-navy-border bg-light-navy/50 p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-lightest-slate">StudioFlow for Android</h3>
                  <p className="mt-1 text-xs text-slate">
                    A floating bubble beside any text box. Keep your own keyboard and dictate into any app with one tap.
                  </p>
                </div>
                <a
                  href={downloadUrl('whisperflow', 'android')}
                  className="inline-flex items-center gap-2 rounded-lg bg-green px-5 py-2.5 font-mono text-xs font-semibold text-navy hover:bg-green/90"
                >
                  <Download className="h-4 w-4" />
                  <span>Download APK</span>
                </a>
              </div>

              <div className="space-y-3 pt-4 border-t border-navy-border/60">
                <h4 className="font-mono text-xs font-semibold text-green">Setup Instructions:</h4>
                <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed text-slate pl-2">
                  <li>Download and install <span className="font-mono text-light-slate">StudioFlow.apk</span> on your Android phone.</li>
                  <li>Open Studio Flow, tap <span className="font-mono text-light-slate">Open Accessibility settings</span>, and switch on Studio Flow.</li>
                  <li>Paste your API key, allow the microphone, and tap Start. The bubble appears next to any text box.</li>
                </ol>
              </div>
            </div>
          )}
        </section>

        {/* Quick API Snippet */}
        <section className="rounded-2xl border border-navy-border bg-light-navy/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-green" />
              <h3 className="font-mono text-xs font-semibold text-lightest-slate">Quick API Integration</h3>
            </div>
            <CopyButton text={curlQuickExample} label="Copy cURL" />
          </div>
          <pre className="overflow-x-auto rounded-xl border border-navy-border bg-navy p-4 font-mono text-xs text-light-slate leading-relaxed">
            {curlQuickExample}
          </pre>
          <div className="pt-2">
            <Link
              to="/products/whisperflow/docs"
              className="inline-flex items-center gap-1.5 font-mono text-xs text-green hover:underline"
            >
              <span>Explore complete API documentation & schemas</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
