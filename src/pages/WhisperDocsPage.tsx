import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Play,
  Download,
  Key,
} from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CopyButton } from '@/components/CopyButton'

type Lang = 'curl' | 'js' | 'python'

const SAMPLES = {
  transcribe: {
    curl: `curl -X POST "https://studio.karanparmar.in/api/studio/v1/whisperflow/transcribe" \\
  -H "Authorization: Bearer sk-studio_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "audio_base64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
  }'`,
    js: `const response = await fetch("https://studio.karanparmar.in/api/studio/v1/whisperflow/transcribe", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk-studio_YOUR_KEY_HERE",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    audio_base64: base64AudioString
  })
});
const data = await response.json();
console.log(data.text);`,
    python: `import requests

url = "https://studio.karanparmar.in/api/studio/v1/whisperflow/transcribe"
headers = {
    "Authorization": "Bearer sk-studio_YOUR_KEY_HERE",
    "Content-Type": "application/json"
}
payload = {
    "audio_base64": base64_audio_string
}

response = requests.post(url, headers=headers, json=payload)
print(response.json()["text"])`,
  },
  format: {
    curl: `curl -X POST "https://studio.karanparmar.in/api/studio/v1/whisperflow/format" \\
  -H "Authorization: Bearer sk-studio_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "point 1 server ghar pe rahega point 2 keyboard android ke liye hai",
    "tone": "whatsapp",
    "script": "roman"
  }'`,
    js: `const response = await fetch("https://studio.karanparmar.in/api/studio/v1/whisperflow/format", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk-studio_YOUR_KEY_HERE",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    text: "point 1 server ghar pe rahega point 2 keyboard android ke liye hai",
    tone: "whatsapp",
    script: "roman" // or "devanagari"
  })
});
const data = await response.json();
console.log(data.text);`,
    python: `import requests

url = "https://studio.karanparmar.in/api/studio/v1/whisperflow/format"
headers = {
    "Authorization": "Bearer sk-studio_YOUR_KEY_HERE",
    "Content-Type": "application/json"
}
payload = {
    "text": "point 1 server ghar pe rahega point 2 keyboard android ke liye hai",
    "tone": "whatsapp",
    "script": "roman"
}

response = requests.post(url, headers=headers, json=payload)
print(response.json()["text"])`,
  },
  job: {
    curl: `curl "https://studio.karanparmar.in/api/studio/v1/whisperflow/jobs/JOB_ID_HERE" \\
  -H "Authorization: Bearer sk-studio_YOUR_KEY_HERE"`,
    js: `const response = await fetch("https://studio.karanparmar.in/api/studio/v1/whisperflow/jobs/JOB_ID_HERE", {
  headers: {
    "Authorization": "Bearer sk-studio_YOUR_KEY_HERE"
  }
});
const data = await response.json();
console.log(data.status, data.result?.text);`,
    python: `import requests

url = "https://studio.karanparmar.in/api/studio/v1/whisperflow/jobs/JOB_ID_HERE"
headers = {"Authorization": "Bearer sk-studio_YOUR_KEY_HERE"}

response = requests.get(url, headers=headers)
print(response.json())`,
  },
}

export function WhisperDocsPage() {
  const [lang, setLang] = useState<Lang>('curl')

  return (
    <DashboardLayout>
      <div className="space-y-12">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-navy-border/60 pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-slate">
            <Link to="/dashboard" className="hover:text-green">Dashboard</Link>
            <span>/</span>
            <Link to="/products/whisperflow" className="hover:text-green">WhisperFlow</Link>
            <span>/</span>
            <span className="text-green font-medium">Docs & API</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/products/whisperflow"
              className="inline-flex items-center gap-1.5 rounded-md border border-navy-border bg-light-navy/50 px-3 py-1.5 font-mono text-xs text-light-slate hover:border-green/40 hover:text-green"
            >
              <span>Project Details</span>
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

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-green/30 bg-green-tint px-3 py-1 font-mono text-xs text-green">
            <BookOpen className="h-3.5 w-3.5 text-green" />
            <span>Developer Reference</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-lightest-slate sm:text-4xl">
            WhisperFlow API Documentation
          </h1>
          <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-slate">
            Integrate speech transcription and LLM text shaping into your personal automations, bots, or apps. Authenticate with your single Studio API key.
          </p>
        </div>

        {/* Global Language Selector */}
        <div className="flex items-center justify-between border-b border-navy-border/60 pb-3">
          <span className="font-mono text-xs text-slate uppercase tracking-wider">Code Language</span>
          <div className="flex items-center rounded-lg border border-navy-border bg-navy/80 p-1">
            {(['curl', 'js', 'python'] as Lang[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setLang(tab)}
                className={`rounded-md px-3 py-1 font-mono text-xs font-medium transition-all ${
                  lang === tab
                    ? 'bg-green-tint text-green border border-green/30'
                    : 'text-slate hover:text-light-slate'
                }`}
              >
                {tab === 'curl' ? 'cURL' : tab === 'js' ? 'JavaScript' : 'Python'}
              </button>
            ))}
          </div>
        </div>

        {/* Authentication Card */}
        <div className="rounded-2xl border border-navy-border bg-light-navy/50 p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Key className="h-4 w-4 text-green" />
            <h2 className="text-lg font-bold text-lightest-slate">Authentication</h2>
          </div>
          <p className="text-xs leading-relaxed text-slate">
            Every request to WhisperFlow endpoints requires your Studio API key passed via the standard HTTP{' '}
            <code className="rounded bg-navy px-1.5 py-0.5 font-mono text-light-slate">Authorization</code> header:
          </p>
          <div className="flex items-center justify-between rounded-xl border border-navy-border bg-navy px-4 py-3">
            <code className="font-mono text-xs text-green break-all">
              Authorization: Bearer sk-studio_YOUR_API_KEY
            </code>
            <CopyButton text="Authorization: Bearer sk-studio_YOUR_API_KEY" label="Copy" />
          </div>
          <p className="text-xs text-slate">
            Need a key? Generate or rotate your key in the{' '}
            <Link to="/keys" className="text-green underline hover:text-green/80">
              API Keys
            </Link>{' '}
            section.
          </p>
        </div>

        {/* Endpoint 1: Transcribe */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-green/10 border border-green/30 px-2.5 py-1 font-mono text-xs font-bold text-green">
                POST
              </span>
              <span className="font-mono text-sm font-semibold text-lightest-slate">
                /api/studio/v1/whisperflow/transcribe
              </span>
            </div>
            <span className="font-mono text-xs text-slate">Speech Recognition</span>
          </div>

          <p className="text-xs sm:text-sm text-slate">
            Transcribes base64-encoded audio using local GPU Tara CT2 (faster-whisper) with zero cloud telemetry.
          </p>

          {/* Parameters Table */}
          <div className="overflow-x-auto rounded-xl border border-navy-border bg-navy/60">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-navy-border bg-light-navy/60 text-lightest-slate">
                <tr>
                  <th className="px-4 py-2.5">Field</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Required</th>
                  <th className="px-4 py-2.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-border/60 text-slate">
                <tr>
                  <td className="px-4 py-3 text-green font-semibold">audio_base64</td>
                  <td className="px-4 py-3 text-light-slate">string</td>
                  <td className="px-4 py-3 text-green">Yes</td>
                  <td className="px-4 py-3">Base64 encoded audio string (WAV, MP3, WebM, OGG).</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Code Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-slate">Example Request</span>
              <CopyButton text={SAMPLES.transcribe[lang]} label="Copy Code" />
            </div>
            <pre className="overflow-x-auto rounded-xl border border-navy-border bg-navy p-4 font-mono text-xs text-light-slate leading-relaxed">
              {SAMPLES.transcribe[lang]}
            </pre>
          </div>

          {/* Response Preview */}
          <div className="space-y-2">
            <span className="font-mono text-[11px] text-slate">Response (200 OK)</span>
            <pre className="overflow-x-auto rounded-xl border border-navy-border bg-navy/80 p-4 font-mono text-xs text-green leading-relaxed">
{`{
  "text": "point 1 server stays at home point 2 keyboard is for android"
}`}
            </pre>
          </div>
        </section>

        {/* Endpoint 2: Format */}
        <section className="space-y-4 pt-6 border-t border-navy-border/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-green/10 border border-green/30 px-2.5 py-1 font-mono text-xs font-bold text-green">
                POST
              </span>
              <span className="font-mono text-sm font-semibold text-lightest-slate">
                /api/studio/v1/whisperflow/format
              </span>
            </div>
            <span className="font-mono text-xs text-slate">LLM Text Shaping</span>
          </div>

          <p className="text-xs sm:text-sm text-slate">
            Punctuates, converts lists into clean numbered points, and transliterates into Roman Hinglish or Devanagari script via Qwen 2.5 7B.
          </p>

          {/* Parameters Table */}
          <div className="overflow-x-auto rounded-xl border border-navy-border bg-navy/60">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-navy-border bg-light-navy/60 text-lightest-slate">
                <tr>
                  <th className="px-4 py-2.5">Field</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Default</th>
                  <th className="px-4 py-2.5">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-border/60 text-slate">
                <tr>
                  <td className="px-4 py-3 text-green font-semibold">text</td>
                  <td className="px-4 py-3 text-light-slate">string</td>
                  <td className="px-4 py-3 text-slate">required</td>
                  <td className="px-4 py-3">Raw speech transcript or text to format.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-green font-semibold">tone</td>
                  <td className="px-4 py-3 text-light-slate">string</td>
                  <td className="px-4 py-3 text-light-slate">"whatsapp"</td>
                  <td className="px-4 py-3">Formatting tone: <code className="text-light-slate">"whatsapp"</code>, <code className="text-light-slate">"work"</code>, or <code className="text-light-slate">"points"</code>.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-green font-semibold">script</td>
                  <td className="px-4 py-3 text-light-slate">string</td>
                  <td className="px-4 py-3 text-light-slate">"roman"</td>
                  <td className="px-4 py-3">Target script: <code className="text-light-slate">"roman"</code> (Latin Hinglish) or <code className="text-light-slate">"devanagari"</code>.</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Code Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-slate">Example Request</span>
              <CopyButton text={SAMPLES.format[lang]} label="Copy Code" />
            </div>
            <pre className="overflow-x-auto rounded-xl border border-navy-border bg-navy p-4 font-mono text-xs text-light-slate leading-relaxed">
              {SAMPLES.format[lang]}
            </pre>
          </div>

          {/* Response Preview */}
          <div className="space-y-2">
            <span className="font-mono text-[11px] text-slate">Response (200 OK)</span>
            <pre className="overflow-x-auto rounded-xl border border-navy-border bg-navy/80 p-4 font-mono text-xs text-green leading-relaxed">
{`{
  "text": "1. server stays at home.\\n2. keyboard is for android."
}`}
            </pre>
          </div>
        </section>

        {/* Endpoint 3: Async Polling */}
        <section className="space-y-4 pt-6 border-t border-navy-border/60">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 font-mono text-xs font-bold text-blue-400">
                GET
              </span>
              <span className="font-mono text-sm font-semibold text-lightest-slate">
                /api/studio/v1/whisperflow/jobs/{'{job_id}'}
              </span>
            </div>
            <span className="font-mono text-xs text-slate">Async Queue Polling</span>
          </div>

          <p className="text-xs sm:text-sm text-slate">
            When a local or remote model lane is busy processing a concurrent request, calls immediately return HTTP 202 with a queue job ID. Poll this endpoint every 1.5 seconds until status is <code className="text-green">"done"</code>.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-slate">Poll Request</span>
              <CopyButton text={SAMPLES.job[lang]} label="Copy Code" />
            </div>
            <pre className="overflow-x-auto rounded-xl border border-navy-border bg-navy p-4 font-mono text-xs text-light-slate leading-relaxed">
              {SAMPLES.job[lang]}
            </pre>
          </div>
        </section>

        {/* HTTP Status Reference */}
        <section className="space-y-4 pt-6 border-t border-navy-border/60">
          <h3 className="text-lg font-bold text-lightest-slate">Status & Error Codes</h3>
          <div className="overflow-x-auto rounded-xl border border-navy-border bg-navy/60">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-navy-border bg-light-navy/60 text-lightest-slate">
                <tr>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Meaning</th>
                  <th className="px-4 py-2.5">Handling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-border/60 text-slate">
                <tr>
                  <td className="px-4 py-3 text-green font-semibold">200 OK</td>
                  <td className="px-4 py-3">Success</td>
                  <td className="px-4 py-3">Result payload contains formatted text.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-blue-400 font-semibold">202 Accepted</td>
                  <td className="px-4 py-3">Queued</td>
                  <td className="px-4 py-3">Poll the returned job ID until done.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-[#ff8b8b] font-semibold">401 Unauthorized</td>
                  <td className="px-4 py-3">Invalid API Key</td>
                  <td className="px-4 py-3">Check Authorization Bearer header.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-[#ff8b8b] font-semibold">429 Rate Limited</td>
                  <td className="px-4 py-3">Queue Full</td>
                  <td className="px-4 py-3">Maximum queue depth (&gt;20 requests) exceeded.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-[#ff8b8b] font-semibold">503 Unavailable</td>
                  <td className="px-4 py-3">Gateway Down</td>
                  <td className="px-4 py-3">Model tunnel is currently offline or unreachable.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
