import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { useAuth } from '@/components/Auth'
import { FadeIn, Stagger, StaggerItem } from '@/components/Fade'
import { productNav } from '@/lib/products'
import { CONTACT_EMAIL, serviceOpen, useServices } from '@/lib/services'

export function DashboardPage() {
  const { user } = useAuth()
  const { projects: catalog } = useServices()
  const firstName = user?.name ? user.name.split(' ')[0] : 'there'

  return (
    <DashboardLayout>
      <div className="space-y-10">
        <FadeIn className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Welcome back, {firstName}. How are you?
          </h1>
          <p className="text-base text-slate">Here are the products you can use.</p>
        </FadeIn>

        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2" delay={0.12}>
          {productNav(catalog).map((product) => {
            const Icon = product.icon
            const live = serviceOpen(catalog, product.slug)
            const blurb = catalog.find((item) => item.slug === product.slug)?.description ?? ''
            return (
              <StaggerItem key={product.slug}>
                <Link
                  to={product.base}
                  className="group block rounded-2xl border border-navy-border bg-light-navy p-6 transition-all duration-300 hover:-translate-y-1 hover:border-green/40 hover:shadow-lg hover:shadow-green/10"
                >
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-green transition-transform duration-300 group-hover:scale-110" />
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${live ? 'bg-green/15 text-green' : 'bg-navy text-slate'}`}>
                      {live ? 'Live' : 'Off'}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-white">{product.name}</h2>
                  {live ? (
                    <p className="mt-2 text-sm leading-relaxed text-slate">{blurb}</p>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed text-slate">
                      Contact Karan right now at {CONTACT_EMAIL}.
                    </p>
                  )}
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-green">
                    Open
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </StaggerItem>
            )
          })}
        </Stagger>
      </div>
    </DashboardLayout>
  )
}
