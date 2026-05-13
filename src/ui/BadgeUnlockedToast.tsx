// Bottom-right toast that fires whenever a badge unlocks. Drains the queue
// one at a time; auto-dismisses after ~5 seconds and on click. Mounted at
// the App root so it shows over every screen.
import { useEffect } from 'react'
import { useGame } from '../game/state'
import { badgesById } from '../progression/badges'

const TOAST_DURATION_MS = 5000

export default function BadgeUnlockedToast() {
  const queue = useGame((s) => s.badges.toastQueue)
  const dismiss = useGame((s) => s.dismissBadgeToast)
  const currentId = queue[0]

  useEffect(() => {
    if (!currentId) return
    const handle = window.setTimeout(() => dismiss(currentId), TOAST_DURATION_MS)
    return () => window.clearTimeout(handle)
  }, [currentId, dismiss])

  if (!currentId) return null
  const badge = badgesById[currentId]
  if (!badge) return null

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50">
      <button
        onClick={() => dismiss(currentId)}
        className="pointer-events-auto flex max-w-sm items-start gap-3 border border-mc-amber bg-panel-bg/95 p-3 text-left shadow-lg shadow-mc-amber/20 transition-transform animate-in"
      >
        <span className="text-3xl" aria-hidden>
          {badge.icon}
        </span>
        <div className="flex flex-1 flex-col">
          <div className="font-mono text-[10px] uppercase tracking-widest text-mc-amber">
            Badge unlocked
          </div>
          <div className="font-mono text-sm text-mc-cyan">{badge.title}</div>
          <div className="mt-0.5 text-[11px] leading-snug text-mc-text">{badge.blurb}</div>
        </div>
      </button>
    </div>
  )
}
