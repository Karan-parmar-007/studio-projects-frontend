// Shared with /home/karan/my_website/new_frontend/portfolio_frontend/src/components/chat: keep both copies in sync.
// This is the ONE file that is meant to differ between the two copies: it adapts the widget
// to each site (auth, config loading, styling). Every other file should stay identical.
import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { useAuth } from '@/components/Auth'
import { api } from '@/lib/api'
import { refreshSession as refreshSso, sso } from '@/lib/sso'
import type { ChatConfig } from './types'

export const SURFACE: 'studio' | 'portfolio' = 'studio'

/** Studio backend, same-origin (Caddy in prod, the Vite proxy in dev). */
export const API_BASE = '/api/studio'

export function csrfToken(): string | null {
  return sso.csrfToken()
}

/** One silent session refresh after a 401. Never throws. */
export function refreshSession(): Promise<boolean> {
  return refreshSso()
}

export function loginUrl(): string {
  return sso.loginUrl(window.location.pathname + window.location.search)
}

/** Where the "Open in Studio" link for a prepared search points. On Studio it stays in the app. */
export function studioPath(openUrl: string, query: string): string {
  let path = '/products/gmaps/playground'
  try {
    path = new URL(openUrl).pathname
  } catch {
    /* keep the default */
  }
  return `${path}?${query}`
}

export function useReduced(): boolean {
  return Boolean(useReducedMotion())
}

/** The assistant's config for this person. Reloaded when they sign in or out. */
export function useChatConfig(): ChatConfig | null {
  const { user, status } = useAuth()
  const [config, setConfig] = useState<ChatConfig | null>(null)
  const who = status === 'loading' ? null : (user?.id ?? 'anonymous')

  useEffect(() => {
    if (who === null) return
    let live = true
    api<ChatConfig>(`/chatbot/config?surface=${SURFACE}`)
      .then((next) => live && setConfig(next))
      .catch(() => live && setConfig(null))
    return () => {
      live = false
    }
  }, [who])

  return config
}

/** Class names that differ between the two design systems. */
export const tone = {
  solid: 'bg-green text-ink hover:bg-green-hover',
  bubble: 'bottom-5 right-5',
  panel: 'sm:bottom-24 sm:right-5',
  /** Light text on the dark lightbox backdrop ("white" is the dark ink colour in Studio). */
  onDark: 'text-navy',
  /** Behind figure images, most of which are drawn for a white page. */
  figureBg: 'bg-light-navy',
}
