import { BookOpen, Download, FileText, MapPin, MessageSquare, Play, Radio, Sparkles, type LucideIcon } from 'lucide-react'
import type { Project } from '@/lib/api'

// Sub-pages of a product, relative to /products/<slug>. The catalog decides which products exist.
type SubPage = { label: string; crumb: string; sub: '' | '/playground' | '/docs' | '/download'; icon: LucideIcon }

const OVERVIEW: SubPage = { label: 'Overview', crumb: 'Overview', sub: '', icon: FileText }
const PLAYGROUND: SubPage = { label: 'Playground', crumb: 'Playground', sub: '/playground', icon: Play }
const DOCS: SubPage = { label: 'Docs & API', crumb: 'API Reference', sub: '/docs', icon: BookOpen }
const DOWNLOAD: SubPage = { label: 'Download Apps', crumb: 'Download', sub: '/download', icon: Download }

const KNOWN: Record<string, { name: string; icon: LucideIcon; pages: SubPage[]; aliases?: string[] }> = {
  whisperflow: {
    name: 'WhisperFlow',
    icon: Radio,
    pages: [OVERVIEW, PLAYGROUND, DOCS, DOWNLOAD],
    aliases: ['/whisperflow-clone'],
  },
  llm: { name: 'LLM', icon: MessageSquare, pages: [OVERVIEW, PLAYGROUND, DOCS] },
  gmaps: { name: 'Maps Scraper', icon: MapPin, pages: [OVERVIEW, PLAYGROUND, DOCS] },
}

export type ProductPage = { label: string; crumb: string; path: string; icon: LucideIcon; aliases: string[] }

export type ProductNav = {
  slug: string
  name: string
  icon: LucideIcon
  base: string
  aliases: string[]
  pages: ProductPage[]
}

function navFor(slug: string, name?: string): ProductNav {
  const known = KNOWN[slug]
  const base = `/products/${slug}`
  const aliases = known?.aliases ?? []
  const pages = (known?.pages ?? [OVERVIEW]).map((page) => ({
    label: page.label,
    crumb: page.crumb,
    path: base + page.sub,
    icon: page.icon,
    aliases: aliases.map((alias) => alias + page.sub),
  }))
  return { slug, name: name || known?.name || slug, icon: known?.icon ?? Sparkles, base, aliases, pages }
}

/** Products in catalog order. Until the catalog loads, the known products are shown. */
export function productNav(projects: Project[]): ProductNav[] {
  if (!projects.length) return Object.keys(KNOWN).map((slug) => navFor(slug))
  return projects.map((project) => navFor(project.slug, project.name))
}

export function productIcon(slug: string): LucideIcon {
  return KNOWN[slug]?.icon ?? Sparkles
}

/** The product a path belongs to, e.g. /products/gmaps/docs -> gmaps. */
export function activeProduct(path: string, nav: ProductNav[]): ProductNav | null {
  return (
    nav.find((item) =>
      [item.base, ...item.aliases].some((root) => path === root || path.startsWith(root + '/')),
    ) ?? null
  )
}

/** The sub-page a path is on. Falls back to the overview. */
export function activePage(path: string, product: ProductNav): ProductPage {
  const exact = product.pages.find((page) => page.path === path || page.aliases.includes(path))
  return exact ?? product.pages[0]
}
