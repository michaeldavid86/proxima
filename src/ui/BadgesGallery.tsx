// Full-screen modal showing all 18 v1.4 badges grouped by category. Locked
// badges are dimmed with a hint; unlocked badges show the blurb and an
// unlock date.
import { useGame } from '../game/state'
import { BADGES } from '../progression/badges'
import type { BadgeCategory } from '../progression/types'
import Button from './components/Button'

const CATEGORY_LABEL: Record<BadgeCategory, string> = {
  mission: 'Missions',
  learning: 'Learning Track',
  discipline: 'Operational Discipline',
  discovery: 'Discovery',
}

const CATEGORY_ORDER: BadgeCategory[] = ['mission', 'learning', 'discipline', 'discovery']

const formatDate = (ms: number) => {
  try {
    return new Date(ms).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function BadgesGallery({ onClose }: { onClose: () => void }) {
  const unlocked = useGame((s) => s.badges.unlocked)
  const total = BADGES.length
  const unlockedCount = Object.keys(unlocked).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col border border-mc-cyan/40 bg-panel-bg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-mc-cyan/30 bg-panel-fill px-4 py-3">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-sm text-mc-cyan">Operator Badges</span>
            <span className="font-mono text-[11px] text-mc-dim">
              {unlockedCount} of {total} earned
            </span>
          </div>
          <Button onClick={onClose}>✕ Close</Button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          {CATEGORY_ORDER.map((cat) => {
            const badges = BADGES.filter((b) => b.category === cat)
            const earnedInCat = badges.filter((b) => unlocked[b.id]).length
            return (
              <section key={cat} className="mb-6">
                <div className="mb-2 flex items-baseline justify-between border-b border-mc-cyan/15 pb-1">
                  <h3 className="panel-title">{CATEGORY_LABEL[cat]}</h3>
                  <span className="font-mono text-[10px] text-mc-dim">
                    {earnedInCat} / {badges.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {badges.map((b) => {
                    const u = unlocked[b.id]
                    const isUnlocked = !!u
                    return (
                      <div
                        key={b.id}
                        className={`flex items-start gap-3 border p-3 ${
                          isUnlocked
                            ? 'border-mc-amber/50 bg-mc-amber/5'
                            : 'border-mc-cyan/15 bg-panel-fill opacity-60'
                        }`}
                      >
                        <span
                          className={`text-3xl ${isUnlocked ? '' : 'grayscale'}`}
                          aria-hidden
                        >
                          {b.icon}
                        </span>
                        <div className="flex flex-1 flex-col">
                          <div
                            className={`font-mono text-sm ${
                              isUnlocked ? 'text-mc-amber' : 'text-mc-dim'
                            }`}
                          >
                            {b.title}
                          </div>
                          <div className="mt-0.5 text-[11px] leading-snug text-mc-text">
                            {isUnlocked ? b.blurb : b.hint}
                          </div>
                          {isUnlocked && (
                            <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-mc-dim">
                              Earned {formatDate(u.unlockedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
