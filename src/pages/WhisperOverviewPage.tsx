import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Download, Play, Shield } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'

const steps = [
  {
    n: '01',
    title: 'You speak',
    body: 'On a computer, press the shortcut and talk. On Android, tap the bubble. Hindi, English, and Hinglish all work.',
  },
  {
    n: '02',
    title: 'The words are written down',
    body: 'What you said is written down. Hindi, English, and Hinglish stay as you spoke them.',
  },
  {
    n: '03',
    title: 'It lands in the box you were using',
    body: 'The finished text is pasted where your cursor already was. You do not copy it across by hand.',
  },
]

export function WhisperOverviewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">WhisperFlow</h1>
            <p className="text-base leading-relaxed text-slate sm:text-lg">
              Speak, and the text shows up. The website, the playground, and the apps all use this same API. One key works in every place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/products/whisperflow/playground"
              className="inline-flex items-center gap-2 rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-ink hover:bg-green-hover"
            >
              <Play className="h-4 w-4" />
              Try it
            </Link>
            <Link
              to="/products/whisperflow/docs"
              className="inline-flex items-center gap-2 rounded-full border border-navy-border bg-light-navy px-5 py-2.5 text-sm font-medium text-white hover:border-green/40"
            >
              <BookOpen className="h-4 w-4 text-green" />
              API docs
            </Link>
            <Link
              to="/products/whisperflow/download"
              className="inline-flex items-center gap-2 rounded-full border border-navy-border bg-light-navy px-5 py-2.5 text-sm font-medium text-white hover:border-green/40"
            >
              <Download className="h-4 w-4 text-green" />
              Download
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
            <h2 className="text-base font-semibold text-white">Need the words rewritten?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              WhisperFlow writes down what you said. Cleaning up that text, or asking a question, is the LLM chatbot.
            </p>
            <Link to="/products/llm" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-green hover:underline">
              Open the LLM
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="rounded-2xl border border-navy-border bg-light-navy p-6">
            <h2 className="text-base font-semibold text-white">Same API in the apps</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Windows, Android, Linux, and macOS call the same endpoints as this page. Generate one key and paste it into the app.
            </p>
          </div>
          <div className="rounded-2xl border border-navy-border bg-light-navy p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-white">
              <Shield className="h-4 w-4 text-green" />
              Admin console
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              WhisperFlow is managed in the admin console. That is where the downloadable apps are uploaded and replaced.
            </p>
            <Link to="/admin" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-green hover:underline">
              Open admin
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <p className="text-sm text-slate">
          Nothing you send is stored.{' '}
          <Link to="/keys" className="text-green hover:underline">
            Generate an API key
            <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
          </Link>
        </p>
      </div>
    </DashboardLayout>
  )
}
