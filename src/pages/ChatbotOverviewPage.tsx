import { MessageCircle } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { openChat } from '@/chat/ChatWidget'

const points = [
  {
    title: 'Knows Karan and Studio',
    body: 'It answers from Karan’s profile, his portfolio, and the Studio product list, and says so when it does not know.',
  },
  {
    title: 'On every page',
    body: 'The round button at the bottom right opens it here in Studio and on karanparmar.in. Your chat stays while you move between pages.',
  },
  {
    title: 'Can prepare a Maps search',
    body: 'Signed in, ask it to find businesses, like "dentists in Austin". It checks your quota and shows a card; nothing runs until you press Run.',
  },
]

export function ChatbotOverviewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Assistant</h1>
            <p className="text-base leading-relaxed text-slate sm:text-lg">
              A small assistant for this site. Ask who Karan is, what he has built, or how a Studio product works.
              Answers point to where they came from.
            </p>
          </div>
          <button
            type="button"
            onClick={openChat}
            className="inline-flex items-center gap-2 self-start rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-ink hover:bg-green-hover lg:self-auto"
          >
            <MessageCircle className="h-4 w-4" />
            Open the assistant
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {points.map((point) => (
            <div key={point.title} className="rounded-2xl border border-navy-border bg-light-navy p-6">
              <h2 className="text-base font-semibold text-white">{point.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate">{point.body}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-slate">
          It runs on a small CPU model, so an answer can take up to a minute. You can stop it at any time. If the
          button is missing, the assistant is switched off right now.
        </p>
      </div>
    </DashboardLayout>
  )
}
