import { Link } from 'react-router-dom'
import { BookOpen, Play } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'

const steps = [
  {
    n: '01',
    title: 'Pick a document',
    body: 'Ask about the long illustrated book that is already loaded, or upload your own PDF, Word, PowerPoint, Markdown or text file.',
  },
  {
    n: '02',
    title: 'Ask in plain words',
    body: 'The right passages are found first, then the answer is written from them. Follow-up questions keep the thread.',
  },
  {
    n: '03',
    title: 'Check the answer',
    body: 'Every claim cites its passage like [2]. Hover a number to read the passage, and see the figures that go with it.',
  },
]

export function RagOverviewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Ask a Document</h1>
            <p className="text-base leading-relaxed text-slate sm:text-lg">
              Ask questions about a long illustrated book, or about a document of your own. Answers quote the
              passages they come from and show the figures that belong to them.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/products/rag/playground"
              className="inline-flex items-center gap-2 rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-ink hover:bg-green-hover"
            >
              <Play className="h-4 w-4" />
              Try it
            </Link>
            <Link
              to="/products/rag/docs"
              className="inline-flex items-center gap-2 rounded-full border border-navy-border bg-light-navy px-5 py-2.5 text-sm font-medium text-white hover:border-green/40"
            >
              <BookOpen className="h-4 w-4 text-green" />
              API docs
            </Link>
          </div>
        </div>

        <ol className="grid gap-4 lg:grid-cols-3">
          {steps.map((step) => (
            <li key={step.n} className="rounded-2xl border border-navy-border bg-light-navy p-6">
              <span className="font-mono text-xs text-green">{step.n}</span>
              <h2 className="mt-3 text-lg font-semibold text-white">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-navy-border bg-light-navy p-6">
            <h2 className="text-base font-semibold text-white">Your own document</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Upload one document of up to 5 MB. It is read in a minute or two and deleted automatically after an
              hour, or sooner if you delete it yourself.
            </p>
          </div>
          <div className="rounded-2xl border border-navy-border bg-light-navy p-6">
            <h2 className="text-base font-semibold text-white">Answers you can check</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              If the document does not say something, the answer says so instead of guessing. Each cited passage
              shows its heading and page.
            </p>
          </div>
          <div className="rounded-2xl border border-navy-border bg-light-navy p-6">
            <h2 className="text-base font-semibold text-white">Runs on a small server</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              The model runs on a CPU, so an answer can take 30 to 60 seconds. You see your place in line while you
              wait, and you can stop at any time.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
