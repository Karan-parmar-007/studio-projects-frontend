import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Key, Play } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CopyButton } from '@/components/CopyButton'

type Lang = 'curl' | 'js' | 'python'

const BASE = 'https://studio.karanparmar.in/api/studio/v1/gmaps'

const SAMPLES = {
  run: {
    curl: `curl -N -X POST "${BASE}/runs/stream" \\
  -H "Authorization: Bearer sk-studio_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "search_term": "dentist",
    "states": ["Nevada"],
    "cities": ["Las Vegas"],
    "limit": 10
  }'`,
    js: `const response = await fetch("${BASE}/runs/stream", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk-studio_YOUR_KEY_HERE",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    search_term: "dentist",
    states: ["Nevada"],
    cities: ["Las Vegas"],
    limit: 10
  })
});
if (!response.ok) throw new Error((await response.json()).detail);

// One JSON event per line (NDJSON).
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\\n");
  buffer = lines.pop();
  for (const line of lines.filter(Boolean)) {
    const event = JSON.parse(line);
    if (event.type === "company") console.log(event.data.company.name);
  }
}`,
    python: `import json
import requests

url = "${BASE}/runs/stream"
headers = {"Authorization": "Bearer sk-studio_YOUR_KEY_HERE"}
payload = {"search_term": "dentist", "states": ["Nevada"], "cities": ["Las Vegas"], "limit": 10}

with requests.post(url, headers=headers, json=payload, stream=True, timeout=600) as response:
    response.raise_for_status()
    for line in response.iter_lines():
        if not line:
            continue
        event = json.loads(line)
        if event["type"] == "company":
            print(event["data"]["company"]["name"])
        elif event["type"] in ("completed", "error"):
            print(event["data"])`,
  },
  quota: {
    curl: `curl "${BASE}/quota" \\
  -H "Authorization: Bearer sk-studio_YOUR_KEY_HERE"`,
    js: `const response = await fetch("${BASE}/quota", {
  headers: { "Authorization": "Bearer sk-studio_YOUR_KEY_HERE" }
});
console.log(await response.json());`,
    python: `import requests

headers = {"Authorization": "Bearer sk-studio_YOUR_KEY_HERE"}
print(requests.get("${BASE}/quota", headers=headers).json())`,
  },
  cities: {
    curl: `curl "${BASE}/locations/cities?state=Nevada&state=Utah" \\
  -H "Authorization: Bearer sk-studio_YOUR_KEY_HERE"`,
    js: `const response = await fetch("${BASE}/locations/cities?state=Nevada&state=Utah", {
  headers: { "Authorization": "Bearer sk-studio_YOUR_KEY_HERE" }
});
console.log((await response.json()).items);`,
    python: `import requests

headers = {"Authorization": "Bearer sk-studio_YOUR_KEY_HERE"}
params = [("state", "Nevada"), ("state", "Utah")]
print(requests.get("${BASE}/locations/cities", headers=headers, params=params).json()["items"])`,
  },
}

const ERRORS = [
  ['404', 'The API key is missing, wrong, or revoked.'],
  ['409', 'You already have a search running. Wait for it to finish.'],
  ['422', 'The body is wrong, or a state or city is not in the list. The message names it.'],
  ['429 quota_exceeded', 'You used all 50 companies for today. It resets at midnight UTC.'],
  ['429 busy', 'Too many searches are running right now. Try again in a minute.'],
  ['503 service_off', 'The Maps Scraper is switched off.'],
]

export function GmapsDocsPage() {
  const [lang, setLang] = useState<Lang>('curl')

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy-border pb-5">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Maps Scraper API</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate">
              Search Google Maps for companies in the United States. Results stream back while the search runs. Use the same Studio API key as your other products. You get 50 companies per day (UTC), shared with the playground.
            </p>
          </div>
          <Link
            to="/products/gmaps/playground"
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
          path="/api/studio/v1/gmaps/runs/stream"
          title="Search"
          body="Starts a search and keeps the connection open. The response is NDJSON: one JSON event per line. Events are started, progress, company, completed, and error. Read lines as they arrive. If you close the connection, the search stops and the companies you did not receive are given back. Do not retry a dropped stream automatically; that starts a new search."
          fields={[
            ['search_term', 'string', 'Yes', 'What to look for, e.g. "dentist". 1 to 200 characters.'],
            ['states', 'string[]', 'No', 'State names or codes, e.g. ["Nevada"] or ["NV"]. Up to 50.'],
            ['cities', 'string[]', 'No', 'City names. With states, each city must be in one of them. Up to 50.'],
            ['countries', 'string[]', 'No', 'Only "United States" is available.'],
            ['limit', 'integer', 'No', '1 to 50. Default: everything left for today.'],
          ]}
          sample={SAMPLES.run[lang]}
          response={`{"type": "started", "data": {"runId": "487046cc-…", "limit": 10, "workers": 4, "perZipCap": 20}}
{"type": "progress", "data": {"status": "running", "companiesFound": 0, "emitted": 0, "limit": 10}}
{"type": "company", "data": {"company": {"name": "Nevada Dentistry & Braces", "phone": "(702) 701-7999", "website": "https://…", "rating": 4.9, "city": "Las Vegas", "state": "Nevada", "zip_code": "89123", …}}}
{"type": "completed", "data": {"status": "completed", "message": "Collected 10 companies.", "companiesTotal": 10}}`}
        />

        <Endpoint
          method="GET"
          path="/api/studio/v1/gmaps/quota"
          title="Quota"
          body="How many of today's companies you have left. The day is UTC."
          fields={[]}
          sample={SAMPLES.quota[lang]}
          response={`{
  "limit": 50,
  "used": 12,
  "remaining": 38,
  "day": "2026-10-25"
}`}
        />

        <Endpoint
          method="GET"
          path="/api/studio/v1/gmaps/locations/cities"
          title="Places"
          body="Cities you can search, optionally only in some states (repeat ?state=). /locations/states and /locations/countries list the rest."
          fields={[['state', 'string (repeatable)', 'No', 'Limit cities to these states.']]}
          sample={SAMPLES.cities[lang]}
          response={`{
  "items": ["Henderson", "Las Vegas", "Provo", "Salt Lake City", "…"]
}`}
        />

        <section className="space-y-4 border-t border-navy-border pt-8">
          <h2 className="text-lg font-semibold text-white">Errors</h2>
          <p className="text-sm text-slate">
            Errors come back as JSON before the stream starts: <code className="font-mono text-green">{'{"detail": "…", "code": "…"}'}</code>
          </p>
          <div className="overflow-x-auto rounded-2xl border border-navy-border">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-navy-border text-slate">
                {ERRORS.map(([code, meaning]) => (
                  <tr key={code}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-green">{code}</td>
                    <td className="px-4 py-3">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
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
      {fields.length > 0 && (
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
      )}
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
