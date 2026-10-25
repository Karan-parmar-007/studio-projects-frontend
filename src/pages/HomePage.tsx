import { Link } from 'react-router-dom'
import { ArrowRight, KeyRound, Layers, MessageSquare, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/components/Auth'
import { FadeIn } from '@/components/Fade'
import { sso } from '@/lib/sso'

const steps = [
  {
    n: '01',
    icon: Layers,
    title: 'Pick a product',
    body: 'WhisperFlow turns speech into text. LLM answers a message.',
  },
  {
    n: '02',
    icon: KeyRound,
    title: 'Generate an API key',
    body: 'One key works for every product, in the browser or in your own code.',
  },
  {
    n: '03',
    icon: MessageSquare,
    title: 'Call the API',
    body: 'The docs show the request. Send it, and read the reply.',
  },
]

export function HomePage() {
  const { user, status } = useAuth()
  const signedIn = status === 'authenticated' && Boolean(user)
  const dashboard = signedIn ? '/dashboard' : sso.loginUrl('/dashboard')

  return (
    <div className="space-y-16 py-6 sm:py-10">
      <FadeIn className="space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          Welcome to Studio.
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-slate">
          Find a product, try it, and call it with your own API key. The documentation shows each request.
        </p>
        <div className="pt-2">
          {signedIn ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-green px-6 py-3 text-sm font-semibold text-ink hover:bg-green-hover"
            >
              Go to the dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <a
              href={dashboard}
              className="inline-flex items-center gap-2 rounded-full bg-green px-6 py-3 text-sm font-semibold text-ink hover:bg-green-hover"
            >
              Go to the dashboard
              <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.08} className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <li key={step.n} className="rounded-2xl border border-navy-border bg-light-navy p-5">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-green" />
                  <span className="font-mono text-xs text-slate">{step.n}</span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate">{step.body}</p>
              </li>
            )
          })}
        </ol>
      </FadeIn>

      <FadeIn delay={0.16}>
        <section className="overflow-hidden rounded-3xl border border-green-border bg-light-navy">
          <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-border bg-green-tint px-3 py-1 text-sm font-medium text-green">
                <ShieldCheck className="h-4 w-4" />
                Privacy
              </div>
              <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Nothing you send is stored.
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-slate sm:text-lg">
                A recording, a file, or a message is used to write the reply. When the reply is ready, that input is gone. There is no history of what you sent.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                'Speech and messages are not saved after the reply.',
                'Nothing you send is used again later.',
                'There is no inbox of past recordings to open.',
              ].map((line) => (
                <li
                  key={line}
                  className="rounded-2xl border border-navy-border bg-navy px-4 py-3 text-sm leading-relaxed text-light-slate"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </FadeIn>
    </div>
  )
}
