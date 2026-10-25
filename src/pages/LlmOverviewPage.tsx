import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Play } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'

const steps = [
  {
    n: '01',
    title: 'You send a message',
    body: 'Type a question, the same way you would in ChatGPT, Claude, or Gemini.',
  },
  {
    n: '02',
    title: 'Qwen 2.5 7B answers',
    body: 'The model replies from what it knows. It can also clean up text you paste in.',
  },
  {
    n: '03',
    title: 'You can call it from code',
    body: 'The same chat is an API. One Studio key sends the message and reads the reply.',
  },
]

export function LlmOverviewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">LLM</h1>
            <p className="text-base leading-relaxed text-slate sm:text-lg">
              This is a chatbot. You write a message, and the model writes back. It works like the chats from OpenAI, Claude, and Gemini. The model here is Qwen 2.5 7B.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/products/llm/playground"
              className="inline-flex items-center gap-2 rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-ink hover:bg-green-hover"
            >
              <Play className="h-4 w-4" />
              Try it
            </Link>
            <Link
              to="/products/llm/docs"
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-navy-border bg-light-navy p-6">
            <h2 className="text-base font-semibold text-white">Chat</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Ask a question. The reply is an answer, not a search result and not a saved history.
            </p>
          </div>
          <div className="rounded-2xl border border-navy-border bg-light-navy p-6">
            <h2 className="text-base font-semibold text-white">Clean up text</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Paste rough text when you want punctuation, a list, or Hindi in Roman letters or Devanagari. WhisperFlow only writes down speech.
            </p>
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
