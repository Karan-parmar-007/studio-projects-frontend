import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, type Project } from '@/lib/api'

export const CONTACT_EMAIL = 'karan.ai.engineer@gmail.com'

type Catalog = {
  projects: Project[]
  reload: () => void
}

const ServiceCatalog = createContext<Catalog>({ projects: [], reload: () => {} })

export function ServiceCatalogProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])

  function reload() {
    api<Project[]>('/projects')
      .then(setProjects)
      .catch(() => setProjects([]))
  }

  useEffect(() => {
    reload()
  }, [])

  return <ServiceCatalog.Provider value={{ projects, reload }}>{children}</ServiceCatalog.Provider>
}

export function useServices(): Catalog {
  return useContext(ServiceCatalog)
}

export function serviceOpen(projects: Project[], slug: string): boolean {
  const row = projects.find((item) => item.slug === slug)
  if (!row) return true
  return row.enabled !== false
}
