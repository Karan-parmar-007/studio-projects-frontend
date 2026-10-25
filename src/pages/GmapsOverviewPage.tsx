import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Play } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'

const steps = [
  {
    n: '01',
    title: 'You name a business and a place',
    body: 'Type what you are looking for, like "dentist" or "plumber", and pick states or cities.',
  },
  {
    n: '02',
    title: 'Google Maps is searched ZIP by ZIP',
    body: 'Companies show up as they are found: name, phone, website, rating, and address.',
  },
  {
    n: '03',
    title: 'You keep the list',
    body: 'Download it as a CSV, or call the same search from code with your Studio API key.',
  },
]

export function GmapsOverviewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Maps Scraper</h1>
            <p className="text-base leading-relaxed text-slate sm:text-lg">
              Find companies on Google Maps. Search by business type and place, and get each company's phone, website, and rating as it is found.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/products/gmaps/playground"
              className="inline-flex items-center gap-2 rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-ink hover:bg-green-hover"
            >
              <Play className="h-4 w-4" />
              Try it
            </Link>
            <Link
              to="/products/gmaps/docs"
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
            <h2 className="text-base font-semibold text-white">United States only</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Places come from a list of US states, cities, and ZIP codes. Other countries are not covered yet.
            </p>
          </div>
          <div className="rounded-2xl border border-navy-border bg-light-navy p-6">
            <h2 className="text-base font-semibold text-white">50 companies a day</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Each account gets 50 companies per day (UTC), shared by the playground and the API. Companies you did not receive are given back.
            </p>
          </div>
          <div className="rounded-2xl border border-navy-border bg-light-navy p-6">
            <h2 className="text-base font-semibold text-white">One search at a time</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              You can run one search at a time. When the scraper is busy with other people's searches, try again in a minute.
            </p>
          </div>
        </div>

        <p className="text-sm text-slate">
          Results go straight to you and are never saved.{' '}
          <Link to="/keys" className="text-green hover:underline">
            Generate an API key
            <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
          </Link>
        </p>
      </div>
    </DashboardLayout>
  )
}
