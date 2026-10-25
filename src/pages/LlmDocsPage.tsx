import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Key, Play } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CopyButton } from '@/components/CopyButton'

type Lang = 'curl' | 'js' | 'python'

const SAMPLES = {
  chat: {
    curl: `curl -X POST "https://studio.karanparmar.in/api/studio/v1/llm/chat" \\
  -H "Authorization: Bearer sk-studio_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "What is a chatbot?"
  }'`,
    js: `const response = await fetch("https://studio.karanparmar.in/api/studio/v1/llm/chat", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk-studio_YOUR_KEY_HERE",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    text: "What is a chatbot?"
  })
});

const data = await response.json();
console.log(data.text);`,
    python: `import requests

url = "https://studio.karanparmar.in/api/studio/v1/llm/chat"
headers = {
    "Authorization": "Bearer sk-studio_YOUR_KEY_HERE",
    "Content-Type": "application/json"
}
payload = {"text": "What is a chatbot?"}

response = requests.post(url, headers=headers, json=payload)
print(response.json()["text"])`,
  },
  format: {
    curl: `curl -X POST "https://studio.karanparmar.in/api/studio/v1/llm/format" \\
  -H "Authorization: Bearer sk-studio_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "point 1 server stays at home point 2 keyboard is for android",
    "script": "roman"
  }'`,
    js: `const response = await fetch("https://studio.karanparmar.in/api/studio/v1/llm/format", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk-studio_YOUR_KEY_HERE",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    text: "point 1 server stays at home point 2 keyboard is for android",
    script: "roman" // "roman" or "devanagari"
  })
});

const data = await response.json();
console.log(data.text);`,
    python: `import requests

url = "https://studio.karanparmar.in/api/studio/v1/llm/format"
headers = {
    "Authorization": "Bearer sk-studio_YOUR_KEY_HERE",
    "Content-Type": "application/json"
}
payload = {
    "text": "point 1 server stays at home point 2 keyboard is for android",
    "script": "roman"
}

response = requests.post(url, headers=headers, json=payload)
print(response.json()["text"])`,
  },
  job: {
    curl: `curl "https://studio.karanparmar.in/api/studio/v1/llm/jobs/JOB_ID_HERE" \\
  -H "Authorization: Bearer sk-studio_YOUR_KEY_HERE"`,
    js: `const response = await fetch("https://studio.karanparmar.in/api/studio/v1/llm/jobs/JOB_ID_HERE", {
  headers: {
    "Authorization": "Bearer sk-studio_YOUR_KEY_HERE"
  }
});

const data = await response.json();
console.log(data.status, data.result?.text);`,
    python: `import requests

url = "https://studio.karanparmar.in/api/studio/v1/llm/jobs/JOB_ID_HERE"
headers = {"Authorization": "Bearer sk-studio_YOUR_KEY_HERE"}
print(requests.get(url, headers=headers).json())`,
  },
}

export function LlmDocsPage() {
  const [lang, setLang] = useState<Lang>('curl')

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy-border pb-5">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">LLM API</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate">
              Qwen 2.5 7B answers a message, or cleans up text you send. Use the same Studio API key as WhisperFlow. The model is the chatbot. There is no separate app to download.
            </p>
          </div>
          <Link
            to="/products/llm/playground"
            className="inline-flex items-center gap-1.5 rounded-full bg-green px-4 py-2 text-sm font-semibold text-ink hover:bg-green-hover"
          >
            <Play className="h-4 w-4" />
            Try it
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate">Sample language</span>
          <div className="flex rounded-xl border border-navy-border bg-navy/80 p-1">
            {(['curl', 'js', 'python'] as Lang[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setLang(tab)}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold ${
                  lang === tab ? 'bg-green-tint text-green' : 'text-slate hover:text-white'
                }`}
              >
                {tab === 'curl' ? 'cURL' : tab === 'js' ? 'JavaScript' : 'Python'}
              </button>
            ))}
          </div>
        </div>

        <section className="space-y-3 rounded-2xl border border-navy-border bg-light-navy p-6">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-green" />
            <h2 className="text-lg font-semibold text-white">Authentication</h2>
          </div>
          <p className="text-sm text-slate">Send your key on every request.</p>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-navy-border bg-navy px-4 py-3">
            <code className="font-mono text-xs text-green sm:text-sm">Authorization: Bearer sk-studio_YOUR_API_KEY</code>
            <CopyButton text="Authorization: Bearer sk-studio_YOUR_API_KEY" label="Copy" />
          </div>
          <p className="text-xs text-slate">
            Create a key on the{' '}
            <Link to="/keys" className="text-green hover:underline">
              API Keys
            </Link>{' '}
            page.
          </p>
        </section>

        <Endpoint
          method="POST"
          path="/api/studio/v1/llm/chat"
          title="Chat"
          body="Send one message. The reply is in text. A busy model returns 202 with a job_id. Poll the job until status is done."
          fields={[
            ['text', 'string', 'Yes', 'The message to answer.'],
          ]}
          sample={SAMPLES.chat[lang]}
          response={`{
  "text": "A chatbot answers a message in plain language."
}`}
        />

        <Endpoint
          method="POST"
          path="/api/studio/v1/llm/format"
          title="Clean up text"
          body="Punctuation, lists, and Hindi script. script is roman or devanagari. This is the same cleanup as the playground."
          fields={[
            ['text', 'string', 'Yes', 'The text to clean up.'],
            ['script', 'string', 'No', 'roman or devanagari. Default is roman.'],
          ]}
          sample={SAMPLES.format[lang]}
          response={`{
  "text": "1. The server stays at home.\\n2. The keyboard is for Android."
}`}
        />

        <Endpoint
          method="GET"
          path="/api/studio/v1/llm/jobs/{job_id}"
          title="Job"
          body="Read a chat or cleanup that came back as 202. Keep the same API key."
          fields={[['job_id', 'string', 'Yes', 'The id from the 202 response.']]}
          sample={SAMPLES.job[lang]}
          response={`{
  "status": "done",
  "result": { "text": "A chatbot answers a message in plain language." }
}`}
        />
      </div>
    </DashboardLayout>
  )
}

function Endpoint({
  method,
  path,
  title,
  body,
  fields,
  sample,
  response,
}: {
  method: string
  path: string
  title: string
  body: string
  fields: string[][]
  sample: string
  response: string
}) {
  return (
    <section className="space-y-4 border-t border-navy-border pt-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-lg border border-green/30 bg-green/10 px-3 py-1 font-mono text-xs font-bold text-green">
          {method}
        </span>
        <span className="font-mono text-sm font-semibold text-white sm:text-base">{path}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate">{title}</span>
      </div>
      <p className="text-sm leading-relaxed text-slate">{body}</p>
      <div className="overflow-x-auto rounded-2xl border border-navy-border">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-navy-border bg-light-navy text-white">
            <tr>
              <th className="px-4 py-3">Field</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Required</th>
              <th className="px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-border text-slate">
            {fields.map((field) => (
              <tr key={field[0]}>
                <td className="px-4 py-3 font-mono text-green">{field[0]}</td>
                <td className="px-4 py-3 font-mono">{field[1]}</td>
                <td className="px-4 py-3">{field[2]}</td>
                <td className="px-4 py-3">{field[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase text-slate">Sample request</span>
        <CopyButton text={sample} label="Copy" />
      </div>
      <pre className="overflow-x-auto rounded-2xl border border-navy-border bg-navy p-5 font-mono text-xs leading-relaxed text-light-slate">
        {sample}
      </pre>
      <span className="text-xs font-semibold uppercase text-slate">Response</span>
      <pre className="overflow-x-auto rounded-2xl border border-navy-border bg-navy p-5 font-mono text-xs leading-relaxed text-green">
        {response}
      </pre>
    </section>
  )
}
