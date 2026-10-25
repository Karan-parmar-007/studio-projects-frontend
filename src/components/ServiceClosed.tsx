import { CONTACT_EMAIL } from '@/lib/services'

export function ServiceClosed({ name }: { name: string }) {
  return (
    <div className="max-w-2xl rounded-3xl border border-navy-border bg-light-navy p-8 sm:p-10">
      <p className="text-sm font-medium text-green">Off</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{name} is off right now.</h1>
      <p className="mt-4 text-base leading-relaxed text-slate">
        Contact Karan right now and he can turn it back on.
      </p>
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="mt-6 inline-flex rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-ink hover:bg-green-hover"
      >
        {CONTACT_EMAIL}
      </a>
    </div>
  )
}
