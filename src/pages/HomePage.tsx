import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Key, Radio, Cpu, Layers } from 'lucide-react'
import { FadeIn, Stagger, StaggerItem } from '@/components/Fade'
import { useAuth } from '@/components/Auth'
import { api, type Project } from '@/lib/api'
import { sso } from '@/lib/sso'

const steps = [
  {
    n: '01',
    icon: Layers,
    title: 'Pick a product',
    body: 'Every product has a dedicated overview, an interactive playground, and comprehensive API documentation.',
  },
  {
    n: '02',
    icon: Key,
    title: 'Generate one key',
    body: 'A single API key powers all Studio products across the Android bubble, the desktop app, or your own code.',
  },
  {
    n: '03',
    icon: Cpu,
    title: 'Run on your hardware',
    body: 'Speech stays local on your RTX 3060 with zero cloud telemetry. LLM shaping routes locally first with private VPS failover.',
  },
]

export function HomePage() {
  const { user, status } = useAuth()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api<Project[]>('/projects')
      .then(setProjects)
      .catch((err: Error) => setError(err.message))
  }, [])

  const signedIn = status === 'authenticated' && Boolean(user)

  return (
    <div className="py-6 sm:py-12">
      {/* Hero Section */}
      <Stagger delay={0.05}>
        <StaggerItem>
          <div className="inline-flex items-center gap-2 rounded-full border border-green/30 bg-green-tint px-3.5 py-1.5 font-mono text-xs text-green backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-green animate-pulse" />
            AI services for the karanparmar.in ecosystem
          </div>
        </StaggerItem>

        <StaggerItem>
          <h1 className="mt-6 max-w-4xl text-[clamp(40px,7vw,72px)] font-extrabold leading-[1.05] tracking-tight text-lightest-slate">
            Studio<span className="text-green">.</span>
          </h1>
        </StaggerItem>

        <StaggerItem>
          <h2 className="mt-4 max-w-2xl text-[clamp(22px,3.5vw,36px)] font-bold leading-tight text-slate">
            Self-hosted AI products you can try for free, with one API key for all of them.
          </h2>
        </StaggerItem>

        <StaggerItem>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-light-slate">
            Run cutting-edge speech transcription and LLM formatting on machines you control. Zero telemetry, local GPU first, and native client apps.
          </p>
        </StaggerItem>

        <StaggerItem>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {signedIn ? (
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-2.5 rounded-lg bg-green px-7 py-3.5 font-mono text-sm font-semibold text-navy transition-all duration-200 hover:bg-green/90 hover:shadow-lg hover:shadow-green/20 active:scale-95"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <a
                  href={sso.signupUrl('/dashboard')}
                  className="inline-flex items-center gap-2 rounded-lg bg-green px-7 py-3.5 font-mono text-sm font-semibold text-navy transition-all duration-200 hover:bg-green/90 hover:shadow-lg hover:shadow-green/20 active:scale-95"
                >
                  <span>Sign up</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={sso.loginUrl('/dashboard')}
                  className="inline-flex items-center rounded-lg border border-navy-border bg-light-navy/50 px-6 py-3.5 font-mono text-sm text-light-slate transition-all hover:border-green/40 hover:text-green active:scale-95"
                >
                  Sign in
                </a>
              </>
            )}
          </div>
        </StaggerItem>
      </Stagger>

      {/* Featured Products Section */}
      <section className="mt-24">
        <div className="flex items-center justify-between border-b border-navy-border/60 pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-green">Available Services</p>
            <h3 className="mt-1 text-2xl font-bold text-lightest-slate">Featured Products</h3>
          </div>
          {signedIn && (
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 font-mono text-xs text-light-slate hover:text-green"
            >
              <span>View all in Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {error ? <p className="mt-4 text-sm text-[#ff8b8b]">{error}</p> : null}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {(projects ?? []).map((project, index) => (
            <FadeIn key={project.slug} delay={0.1 + index * 0.08}>
              <ProductCard project={project} signedIn={signedIn} />
            </FadeIn>
          ))}
          {projects === null && !error ? (
            <div className="flex items-center gap-3 py-8 font-mono text-sm text-green">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-green border-t-transparent" />
              Loading products…
            </div>
          ) : null}
        </div>
      </section>

      {/* Big Tech How It Works Steps */}
      <section className="mt-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-wider text-green">Architecture & Setup</p>
          <h3 className="mt-2 text-3xl font-bold text-lightest-slate">How Studio Works</h3>
          <p className="mt-3 text-sm text-slate">
            Built for developers who value full ownership of their data and hardware.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <FadeIn key={step.n} delay={0.15 + index * 0.08}>
                <article className="h-full rounded-xl border border-navy-border bg-light-navy/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-green/30 hover:bg-light-navy/80 hover:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-green/30 bg-green-tint text-green">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs font-semibold text-green/60">{step.n}</span>
                  </div>
                  <h4 className="mt-5 text-lg font-bold text-lightest-slate">{step.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{step.body}</p>
                </article>
              </FadeIn>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function ProductCard({ project, signedIn }: { project: Project; signedIn: boolean }) {
  const target = signedIn ? '/products/whisperflow' : sso.loginUrl('/products/whisperflow')

  return (
    <article className="group relative flex flex-col justify-between h-full rounded-2xl border border-navy-border bg-light-navy/60 p-6 transition-all duration-300 hover:border-green/40 hover:bg-light-navy hover:shadow-2xl">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-green/30 bg-green-tint text-green">
              {project.slug === 'whisperflow' ? (
                <Radio className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </div>
            <div>
              <h4 className="text-xl font-bold text-lightest-slate group-hover:text-white transition-colors">
                {project.name}
              </h4>
              <p className="font-mono text-xs text-light-slate">{project.tagline}</p>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-medium border ${
              project.status === 'live'
                ? 'border-green/30 bg-green-tint text-green'
                : 'border-navy-border bg-navy text-slate'
            }`}
          >
            {project.status === 'live' ? 'live · free playground' : 'coming soon'}
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate">{project.description}</p>

        {project.apps.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-slate">Client Apps:</span>
            {project.apps.map((app) => (
              <span
                key={app}
                className="rounded-md border border-navy-border bg-navy/60 px-2 py-0.5 font-mono text-[10px] text-light-slate"
              >
                {app}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-navy-border/50 flex items-center justify-between">
        {project.status === 'live' ? (
          <Link
            to={target}
            className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-green transition-all hover:gap-3"
          >
            <span>{signedIn ? 'Open Product Details' : 'Sign in to Explore'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="font-mono text-xs text-slate/60">Coming soon to Studio</span>
        )}
      </div>
    </article>
  )
}
