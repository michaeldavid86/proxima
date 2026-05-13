// Section navigation sidebar for the Learning Track. Shows progress dots,
// titles, time estimates. Cadet can jump nonlinearly.
import { useGame } from '../game/state'
import { LEARNING_SECTIONS } from '../learning/learning-track'
import { READING_LIST } from '../learning/reading-list'

export default function LearningSidebar() {
  const activeIdx = useGame((s) => s.learning.activeSection)
  const completed = useGame((s) => s.learning.completed)
  const setSection = useGame((s) => s.setLearningSection)

  return (
    <aside className="flex h-full w-72 flex-col gap-4 overflow-y-auto border-r border-mc-cyan/20 bg-panel-fill p-3">
      <div>
        <div className="panel-title mb-2">Foundational RPO</div>
        <div className="flex flex-col gap-1">
          {LEARNING_SECTIONS.map((s, i) => {
            const isActive = i === activeIdx
            const isDone = completed[i]
            return (
              <button
                key={s.id}
                onClick={() => setSection(i)}
                className={`flex items-start gap-2 border px-2 py-1.5 text-left font-mono text-[11px] transition-colors ${
                  isActive
                    ? 'border-mc-cyan bg-mc-cyan/10 text-mc-cyan'
                    : 'border-mc-cyan/20 text-mc-text hover:bg-mc-cyan/5'
                }`}
              >
                <span
                  className={`mt-0.5 inline-block h-2 w-2 rounded-full ${
                    isDone ? 'bg-mc-green' : 'bg-mc-dim'
                  }`}
                />
                <span className="flex flex-1 flex-col">
                  <span>
                    {i + 1}. {s.title}
                  </span>
                  <span className="text-[9px] text-mc-dim">{s.estMinutes} min</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <div className="border-t border-mc-cyan/20 pt-3">
        <div className="panel-title mb-2">Readings</div>
        <div className="flex flex-col gap-2">
          {READING_LIST.map((r) => (
            <div key={r.id} className="border border-mc-cyan/15 p-2 text-[10px]">
              <div className="font-mono text-mc-cyan">{r.title}</div>
              {r.author && <div className="text-mc-dim">{r.author}</div>}
              {r.publication && <div className="text-mc-dim">{r.publication}</div>}
              {r.note && <div className="mt-1 text-mc-text">{r.note}</div>}
              {r.url && (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-mc-cyan hover:underline"
                >
                  Open ↗
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
