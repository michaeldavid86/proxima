// localStorage persistence for unlocked badges. Falls back to in-memory only
// if localStorage is unavailable (e.g. SSR, private browsing).
import type { BadgeUnlock } from './types'

const STORAGE_KEY = 'proxima.badges.v1'

export const loadBadgeUnlocks = (): Record<string, BadgeUnlock> => {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, BadgeUnlock>
  } catch {
    return {}
  }
}

export const saveBadgeUnlocks = (unlocks: Record<string, BadgeUnlock>) => {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocks))
  } catch {
    // ignore
  }
}

export const clearBadgeUnlocks = () => {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
