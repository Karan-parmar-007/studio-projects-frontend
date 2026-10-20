import { createSsoClient } from '@/lib/sso/sso-client'

export { isAppAdmin, SsoNetworkError } from '@/lib/sso/sso-client'
export type { SsoSession, SsoUser } from '@/lib/sso/sso-client'

export const SSO_APP_ID = 'studio'

export const sso = createSsoClient({
  ssoUrl: import.meta.env.VITE_SSO_URL || ':5175',
})

const UNAUTHENTICATED_EVENT = 'studio:unauthenticated'

export function notifyUnauthenticated(): void {
  window.dispatchEvent(new CustomEvent(UNAUTHENTICATED_EVENT))
}

export function onUnauthenticated(handler: () => void): () => void {
  window.addEventListener(UNAUTHENTICATED_EVENT, handler)
  return () => window.removeEventListener(UNAUTHENTICATED_EVENT, handler)
}

export async function refreshSession(): Promise<boolean> {
  try {
    return await sso.refresh()
  } catch {
    return false
  }
}
