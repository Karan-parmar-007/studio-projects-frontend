import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Play,
  Key,
  FileText,
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
console.log("Transcribed text:", data.text);`,
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
print("Transcribed text:", response.json()["text"])`,
  },
  format: {
    curl: `curl -X POST "https://studio.karanparmar.in/api/studio/v1/whisperflow/format" \\
  -H "Authorization: Bearer sk-studio_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "point 1 server stays at home point 2 keyboard is for android",
    "tone": "points",
    "script": "roman"
  }'`,
    js: `const response = await fetch("https://studio.karanparmar.in/api/studio/v1/whisperflow/format", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk-studio_YOUR_KEY_HERE",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    text: "point 1 server stays at home point 2 keyboard is for android",
    tone: "points", // "points" | "whatsapp" | "work"
    script: "roman" // "roman" | "devanagari"
  })
});

const data = await response.json();
console.log("Formatted output:", data.text);`,
    python: `import requests

url = "https://studio.karanparmar.in/api/studio/v1/whisperflow/format"
headers = {
    "Authorization": "Bearer sk-studio_YOUR_KEY_HERE",
    "Content-Type": "application/json"
}
payload = {
    "text": "point 1 server stays at home point 2 keyboard is for android",
    "tone": "points",
    "script": "roman"
}

response = requests.post(url, headers=headers, json=payload)
print("Formatted output:", response.json()["text"])`,
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
console.log("Status:", data.status, "Result:", data.result?.text);`,
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
        {/* Header & Quick Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-navy-border pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green">
              <span>Developer Reference</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              WhisperFlow API Documentation
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/products/whisperflow/playground"
              className="inline-flex items-center gap-1.5 rounded-xl bg-green px-4 py-2 text-xs font-semibold text-ink hover:bg-green/90 transition-all shadow-sm"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Interactive Playground</span>
            </Link>
            <Link
              to="/products/whisperflow"
              className="inline-flex items-center gap-1.5 rounded-xl border border-navy-border bg-light-navy px-3.5 py-2 text-xs font-medium text-white hover:border-green/40 hover:text-green transition-all"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Specs</span>
            </Link>
          </div>
        </div>

        {/* Global Code Language Selector */}
        <div className="flex items-center justify-between border-b border-navy-border pb-4">
          <span className="text-xs font-bold text-slate uppercase tracking-wider">
            Sample Language
          </span>
          <div className="flex items-center rounded-xl border border-navy-border bg-navy/80 p-1">
            {(['curl', 'js', 'python'] as Lang[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setLang(tab)}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                  lang === tab
                    ? 'bg-green-tint text-green border border-green/30 shadow-sm'
                    : 'text-slate hover:text-white'
                }`}
              >
                {tab === 'curl' ? 'cURL' : tab === 'js' ? 'JavaScript' : 'Python'}
              </button>
            ))}
          </div>
        </div>

        {/* Authentication Card */}
        <div className="rounded-3xl border border-navy-border bg-light-navy/60 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <Key className="h-5 w-5 text-green" />
            <h2 className="text-lg font-bold text-white">Authentication</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate">
            All requests to WhisperFlow API endpoints require your Studio API key passed via the standard HTTP{' '}
            <code className="rounded-md bg-navy px-2 py-0.5 font-mono text-xs text-white border border-navy-border">
              Authorization
            </code>{' '}
            header:
          </p>
          <div className="flex items-center justify-between rounded-2xl border border-navy-border bg-navy px-5 py-3.5">
            <code className="font-mono text-xs sm:text-sm text-green break-all select-all font-semibold">
              Authorization: Bearer sk-studio_YOUR_API_KEY
            </code>
            <CopyButton text="Authorization: Bearer sk-studio_YOUR_API_KEY" label="Copy Header" />
          </div>
          <p className="text-xs text-slate">
            Your key works for all Studio products. Manage or generate your key in the{' '}
            <Link to="/keys" className="text-green underline font-medium">
              API Keys
            </Link>{' '}
            section.
          </p>
        </div>

        {/* Endpoint 1: Transcribe */}
        <section className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-green/10 border border-green/30 px-3 py-1 font-mono text-xs font-bold text-green">
                POST
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-white">
                /api/studio/v1/whisperflow/transcribe
              </span>
            </div>
            <span className="text-xs font-semibold text-slate uppercase tracking-wider">
              Speech Recognition
            </span>
          </div>

          <p className="text-sm leading-relaxed text-slate">
            Send audio and get the words back.
          </p>

          {/* Parameters Table */}
          <div className="overflow-x-auto rounded-2xl border border-navy-border bg-navy/80">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-navy-border bg-light-navy/80 text-white font-semibold">
                <tr>
                  <th className="px-5 py-3">Field</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Required</th>
                  <th className="px-5 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-border/60 text-slate">
                <tr>
                  <td className="px-5 py-3.5 font-mono text-green font-semibold">audio_base64</td>
                  <td className="px-5 py-3.5 font-mono text-white">string</td>
                  <td className="px-5 py-3.5 text-green font-semibold">Yes</td>
                  <td className="px-5 py-3.5 text-light-slate">
                    Base64-encoded audio file string (WAV, MP3, WebM, OGG).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Code Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate uppercase">Sample Request</span>
              <CopyButton text={SAMPLES.transcribe[lang]} label="Copy Code" />
            </div>
            <pre className="overflow-x-auto rounded-2xl border border-navy-border bg-navy p-5 font-mono text-xs text-light-slate leading-relaxed">
              {SAMPLES.transcribe[lang]}
            </pre>
          </div>

          {/* Response Preview */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate uppercase">Response (200 OK)</span>
            <pre className="overflow-x-auto rounded-2xl border border-navy-border bg-navy/80 p-5 font-mono text-xs text-green leading-relaxed">
{`{
  "text": "point 1 server stays at home point 2 keyboard is for android"
}`}
            </pre>
          </div>
        </section>

        {/* Endpoint 2: Format */}
        <section className="space-y-4 pt-8 border-t border-navy-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-green/10 border border-green/30 px-3 py-1 font-mono text-xs font-bold text-green">
                POST
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-white">
                /api/studio/v1/whisperflow/format
              </span>
            </div>
            <span className="text-xs font-semibold text-slate uppercase tracking-wider">
              LLM Text Shaping
            </span>
          </div>

          <p className="text-sm leading-relaxed text-slate">
            Punctuates, converts lists into clean numbered points, and transliterates into Roman Hinglish or Devanagari script via Qwen 2.5 7B.
          </p>

          {/* Parameters Table */}
          <div className="overflow-x-auto rounded-2xl border border-navy-border bg-navy/80">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-navy-border bg-light-navy/80 text-white font-semibold">
                <tr>
                  <th className="px-5 py-3">Field</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Default</th>
                  <th className="px-5 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-border/60 text-slate">
                <tr>
                  <td className="px-5 py-3.5 font-mono text-green font-semibold">text</td>
                  <td className="px-5 py-3.5 font-mono text-white">string</td>
                  <td className="px-5 py-3.5 text-amber-400 font-semibold">Required</td>
                  <td className="px-5 py-3.5 text-light-slate">
                    Raw speech transcript or raw text to format.
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-mono text-green font-semibold">tone</td>
                  <td className="px-5 py-3.5 font-mono text-white">string</td>
                  <td className="px-5 py-3.5 font-mono text-slate">"whatsapp"</td>
                  <td className="px-5 py-3.5 text-light-slate">
                    Options: <code className="text-white">"points"</code>, <code className="text-white">"whatsapp"</code>, or <code className="text-white">"work"</code>.
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-mono text-green font-semibold">script</td>
                  <td className="px-5 py-3.5 font-mono text-white">string</td>
                  <td className="px-5 py-3.5 font-mono text-slate">"roman"</td>
                  <td className="px-5 py-3.5 text-light-slate">
                    Options: <code className="text-white">"roman"</code> (Latin Hinglish) or <code className="text-white">"devanagari"</code>.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Code Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate uppercase">Sample Request</span>
              <CopyButton text={SAMPLES.format[lang]} label="Copy Code" />
            </div>
            <pre className="overflow-x-auto rounded-2xl border border-navy-border bg-navy p-5 font-mono text-xs text-light-slate leading-relaxed">
              {SAMPLES.format[lang]}
            </pre>
          </div>

          {/* Response Preview */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate uppercase">Response (200 OK)</span>
            <pre className="overflow-x-auto rounded-2xl border border-navy-border bg-navy/80 p-5 font-mono text-xs text-green leading-relaxed">
{`{
  "text": "1. Server stays at home.\\n2. Keyboard is for Android."
}`}
            </pre>
          </div>
        </section>

        {/* Endpoint 3: Async Polling */}
        <section className="space-y-4 pt-8 border-t border-navy-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-blue-500/10 border border-blue-500/30 px-3 py-1 font-mono text-xs font-bold text-blue-400">
                GET
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-white">
                /api/studio/v1/whisperflow/jobs/{'{job_id}'}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate uppercase tracking-wider">
              Async Queue Polling
            </span>
          </div>

          <p className="text-sm leading-relaxed text-slate">
            If the service is busy, the call returns HTTP 202 with a job id. Poll this endpoint every 1.5 seconds until the status is <code className="text-green font-mono">"done"</code>.
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate uppercase">Poll Request</span>
              <CopyButton text={SAMPLES.job[lang]} label="Copy Code" />
            </div>
            <pre className="overflow-x-auto rounded-2xl border border-navy-border bg-navy p-5 font-mono text-xs text-light-slate leading-relaxed">
              {SAMPLES.job[lang]}
            </pre>
          </div>
        </section>

        {/* HTTP Status Reference */}
        <section className="space-y-4 pt-8 border-t border-navy-border">
          <h3 className="text-xl font-bold text-white">HTTP Status Codes Reference</h3>
          <div className="overflow-x-auto rounded-2xl border border-navy-border bg-navy/80">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-navy-border bg-light-navy/80 text-white font-semibold">
                <tr>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Meaning</th>
                  <th className="px-5 py-3">Handling Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-border/60 text-slate">
                <tr>
                  <td className="px-5 py-3.5 font-mono text-green font-bold">200 OK</td>
                  <td className="px-5 py-3.5 text-white font-semibold">Success</td>
                  <td className="px-5 py-3.5 text-light-slate">Result contains the output text.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-mono text-blue-400 font-bold">202 Accepted</td>
                  <td className="px-5 py-3.5 text-white font-semibold">Queued in Lane</td>
                  <td className="px-5 py-3.5 text-light-slate">Poll the returned job ID until done.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-mono text-red-400 font-bold">401 Unauthorized</td>
                  <td className="px-5 py-3.5 text-white font-semibold">Invalid API Key</td>
                  <td className="px-5 py-3.5 text-light-slate">
                    Verify the Authorization Bearer header against your key.
                  </td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-mono text-amber-400 font-bold">429 Rate Limited</td>
                  <td className="px-5 py-3.5 text-white font-semibold">Queue Overloaded</td>
                  <td className="px-5 py-3.5 text-light-slate">Queue depth exceeded 20 requests. Retry with backoff.</td>
                </tr>
                <tr>
                  <td className="px-5 py-3.5 font-mono text-red-400 font-bold">503 Unavailable</td>
                  <td className="px-5 py-3.5 text-white font-semibold">Gateway Offline</td>
                  <td className="px-5 py-3.5 text-light-slate">
                    Model gateway tunnel is offline or not running.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}
