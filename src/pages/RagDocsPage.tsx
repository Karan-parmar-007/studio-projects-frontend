import { Link } from 'react-router-dom'
import { Cookie, Play } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { CopyButton } from '@/components/CopyButton'

const BASE = 'https://studio.karanparmar.in/api/studio/rag'
const COOKIES = `-b "access_token=$ACCESS; csrf_token=$CSRF" -H "X-CSRF-Token: $CSRF"`

const SOURCE = `{
  "id": "6f1c…",
  "title": "quarterly-report",
  "filename": "quarterly-report.pdf",
  "size_bytes": 812345,
  "status": "processing",      // queued | processing | ready | failed
  "stage": "embedding",        // queued | parsing | embedding | linking | graph | figures | complete | failed
  "progress": 42,              // 0-100
  "error": null,
  "active": true,
  "pages": 18, "chunks": null, "figures": null,
  "created_at": "2026-11-10T09:00:00Z",
  "ready_at": null, "completed_at": null,
  "expires_at": "2026-11-10T10:00:00Z"
}`

const EVENTS = [
  ['status', '{stage: "searching" | "writing", ahead}', 'Progress. ahead is how many people are in line before you.'],
  ['sources', '{sources: [{n, heading, page, kind, snippet, document}], figures: [{id, url, label, caption, page, width, height}]}', 'Sent before the first token. n matches the [n] markers in the answer. Figure urls work for 15 minutes.'],
  ['token', '{text}', 'A piece of the answer (Markdown). Append in order.'],
  ['done', '{cached, found}', 'The answer is complete. found is false when the document had nothing relevant.'],
  ['error', '{message, code}', 'The answer stopped. Show the message.'],
]

const ERRORS = [
  ['401 sign_in', 'This needs a signed-in account (asking may be open to everyone; uploading never is).'],
  ['403 forbidden', 'Your account does not have access yet.'],
  ['404', 'There is no document to ask, or you have no upload to delete.'],
  ['409', 'You already have a question being answered, or you already have a document (delete it first).'],
  ['422', 'The body is wrong, the file type is not supported, or the file is too big.'],
  ['429 quota_exceeded', 'You used today’s questions. It resets at midnight UTC.'],
  ['429 busy', 'Too many people are waiting. Try again in a minute.'],
  ['503 service_off / model_offline', 'Ask a Document is switched off, or the model is offline.'],
]

export function RagDocsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy-border pb-5">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Ask a Document API</h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate">
              The endpoints the playground uses. Answers stream back as NDJSON, one JSON event per line. These
              endpoints use your browser session (cookies), not an API key.
            </p>
          </div>
          <Link
            to="/products/rag/playground"
            className="inline-flex items-center gap-1.5 rounded-full bg-green px-4 py-2 text-sm font-semibold text-ink hover:bg-green-hover"
          >
            <Play className="h-4 w-4" />
            Try it
          </Link>
        </div>

        <section className="space-y-3 rounded-2xl border border-navy-border bg-light-navy p-6">
          <div className="flex items-center gap-2">
            <Cookie className="h-5 w-5 text-green" />
            <h2 className="text-lg font-semibold text-white">Authentication</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate">
            Send the <code className="font-mono text-green">access_token</code> and <code className="font-mono text-green">csrf_token</code> cookies
            from a signed-in browser session. Every POST and DELETE also needs the CSRF token repeated in the{' '}
            <code className="font-mono text-green">X-CSRF-Token</code> header. If the admin opened asking to everyone, the status and ask
            endpoints also work with no cookies at all.
          </p>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-navy-border bg-navy px-4 py-3">
            <code className="overflow-x-auto font-mono text-xs text-green">{COOKIES}</code>
            <CopyButton text={COOKIES} label="Copy" />
          </div>
        </section>

        <Endpoint
          method="GET"
          path="/api/studio/rag/status"
          title="Status"
          body="Whether you can ask, the upload limits, the book, and your own upload (if any)."
          fields={[]}
          sample={`curl "${BASE}/status" ${COOKIES}`}
          response={`{
  "enabled": true,
  "access": "signed_in",
  "signed_in": true,
  "can_use": true,
  "reason": "",
  "uploads_enabled": true,
  "upload_max_mb": 5,
  "upload_ttl_minutes": 60,
  "upload_max_pages": 60,
  "accepted": [".docx", ".htm", ".html", ".markdown", ".md", ".pdf", ".pptx", ".txt"],
  "book": { …Source },
  "upload": null
}`}
        />

        <Endpoint
          method="POST"
          path="/api/studio/rag/ask"
          title="Ask"
          body="Ask a question and read the answer as it is written. Answers can take 30 to 60 seconds. Closing the connection stops the answer. Do not retry a dropped stream automatically."
          fields={[
            ['question', 'string', 'Yes', '1 to 1000 characters.'],
            ['target', '"book" | "upload"', 'No', 'Which document to ask. Default "book".'],
            ['history', '{role, content}[]', 'No', 'Earlier turns for follow-ups, oldest first. At most 8. role is "user" or "assistant".'],
          ]}
          sample={`curl -N -X POST "${BASE}/ask" ${COOKIES} \\
  -H "Content-Type: application/json" \\
  -d '{"question": "What does chapter 3 say about tides?", "target": "book", "history": []}'`}
          response={`{"type": "status", "data": {"stage": "searching", "ahead": 0}}
{"type": "sources", "data": {"sources": [{"n": 1, "heading": "Tides", "page": 41, "kind": "text", "snippet": "…", "document": "…"}], "figures": [{"id": "…", "url": "/api/studio/rag/media/…", "label": "Figure 12", "caption": "…", "page": 42, "width": 800, "height": 600}]}}
{"type": "status", "data": {"stage": "writing", "ahead": 0}}
{"type": "token", "data": {"text": "Tides are caused by "}}
{"type": "token", "data": {"text": "the Moon's pull [1]."}}
{"type": "done", "data": {"cached": false, "found": true}}`}
        />

        <Endpoint
          method="POST"
          path="/api/studio/rag/upload"
          title="Upload"
          body="Upload your own document as multipart form data in the field file. Signed in only, one document per person: delete the old one first. It is read in the background (poll GET /upload) and deleted automatically after the time in upload_ttl_minutes. You can ask once status is ready, even while figures are still being described."
          fields={[['file', 'file', 'Yes', 'One of the accepted types, up to upload_max_mb.']]}
          sample={`curl -X POST "${BASE}/upload" ${COOKIES} \\
  -F "file=@quarterly-report.pdf"`}
          response={SOURCE}
        />

        <Endpoint
          method="GET"
          path="/api/studio/rag/upload"
          title="My document"
          body="Your upload and how far reading it has got. Poll every few seconds while status is queued or processing."
          fields={[]}
          sample={`curl "${BASE}/upload" ${COOKIES}`}
          response={`{"upload": { …Source } }   // or {"upload": null}`}
        />

        <Endpoint
          method="DELETE"
          path="/api/studio/rag/upload"
          title="Delete"
          body="Delete your document and everything made from it now. Returns 204."
          fields={[]}
          sample={`curl -X DELETE "${BASE}/upload" ${COOKIES}`}
          response="204 No Content"
        />

        <section className="space-y-4 border-t border-navy-border pt-8">
          <h2 className="text-lg font-semibold text-white">Stream events</h2>
          <p className="text-sm text-slate">
            Each line is <code className="font-mono text-green">{'{"type": "…", "data": {…}}'}</code>. Ignore types you do not know.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-navy-border">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-navy-border bg-light-navy text-white">
                <tr>
                  <th className="px-4 py-3">type</th>
                  <th className="px-4 py-3">data</th>
                  <th className="px-4 py-3">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-border text-slate">
                {EVENTS.map(([type, data, meaning]) => (
                  <tr key={type}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-green">{type}</td>
                    <td className="px-4 py-3 font-mono">{data}</td>
                    <td className="px-4 py-3">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4 border-t border-navy-border pt-8">
          <h2 className="text-lg font-semibold text-white">Errors</h2>
          <p className="text-sm text-slate">
            Errors before the stream starts come back as JSON: <code className="font-mono text-green">{'{"detail": "…", "code": "…"}'}</code>.
            Errors after it starts arrive as an <code className="font-mono text-green">error</code> event.
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
        <span className="rounded-lg border border-green/30 bg-green/10 px-3 py-1 font-mono text-xs font-bold text-green">{method}</span>
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
      <pre className="overflow-x-auto rounded-2xl border border-navy-border bg-navy p-5 font-mono text-xs leading-relaxed text-light-slate">{sample}</pre>
      <span className="text-xs font-semibold uppercase text-slate">Response</span>
      <pre className="overflow-x-auto rounded-2xl border border-navy-border bg-navy p-5 font-mono text-xs leading-relaxed text-green">{response}</pre>
    </section>
  )
}
