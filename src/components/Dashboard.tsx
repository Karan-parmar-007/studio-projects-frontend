import type { ReactNode } from 'react'
import { DashboardLayout } from '@/components/DashboardLayout'

export function AppFrame({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
