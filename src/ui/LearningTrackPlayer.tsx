// Top-level Learning Track screen. Sidebar of section navigation +
// reading list on the left, main panel with section body + demo + optional
// example problem on the right.
import { useGame } from '../game/state'
import { LEARNING_SECTIONS, QUIZ_QUESTIONS } from '../learning/learning-track'
import { problemById } from '../learning/example-problems'
import { historicalVignettes } from '../historical'
import Button from './components/Button'
import LearningSidebar from './LearningSidebar'
import ExampleProblemPanel from './ExampleProblemPanel'
import CrossDomainCueChip from './CrossDomainCueChip'
import { cueById } from '../cross-domain/cues'
import { useState } from 'react'

const QuizDemo = () => {
  const recordAnswer = useGame((s) => s.recordProblemAnswer)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const submit = (qid: string) => {
    setRevealed((r) => ({ ...r, [qid]: true }))
    const q = QUIZ_QUESTIONS.find((x) => x.id === qid)
    if (!q) return
    recordAnswer(qid, selected[qid] === q.correctChoiceId)
  }

  return (
    <div className="space-y-4">
      {QUIZ_QUESTIONS.map((q, i) => {
        const sel = selected[q.id]
        const rev = revealed[q.id]
        const correct = rev && sel === q.correctChoiceId
        return (
          <div key={q.id} className="border border-mc-cyan/30 bg-panel-fill p-3 text-xs">
            <div className="mb-2 font-mono text-mc-cyan">
              Q{i + 1}. {q.prompt}
            </div>
            <div className="flex flex-col gap-1">
              {q.choices.map((c) => {
                const isSelected = sel === c.id
                const isAnswer = c.id === q.correctChoiceId
                let cls = 'border-mc-cyan/30 hover:bg-mc-cyan/5 text-mc-text'
                if (rev && isAnswer) cls = 'border-mc-green bg-mc-green/10 text-mc-green'
                else if (rev && isSelected && !isAnswer) cls = 'border-mc-red bg-mc-red/10 text-mc-red'
                else if (isSelected) cls = 'border-mc-cyan bg-mc-cyan/10 text-mc-cyan'
                return (
                  <button
                    key={c.id}
                    onClick={() => !rev && setSelected((s) => ({ ...s, [q.id]: c.id }))}
                    disabled={rev}
                    className={`flex items-start gap-2 border px-2 py-1.5 text-left transition-colors ${cls}`}
                  >
                    <span className="font-mono text-[10px]">{c.id.toUpperCase()}.</span>
                    <span>{c.text}</span>
                  </button>
                )
              })}
            </div>
            {!rev && (
              <Button
                onClick={() => submit(q.id)}
                disabled={!sel}
                variant="warn"
                className="mt-2 !py-1 !text-[10px]"
              >
                Submit
              </Button>
            )}
            {rev && (
              <div
                className={`mt-2 border p-2 text-[11px] ${
                  correct
                    ? 'border-mc-green/40 bg-mc-green/5 text-mc-green'
                    : 'border-mc-amber/40 bg-mc-amber/5 text-mc-amber'
                }`}
              >
                <div className="mb-1 font-mono">
                  {correct ? '✓ Correct' : '✕ Not quite'}
                </div>
                <div className="text-mc-text">{q.explanation}</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const HistoricalCarousel = () => {
  const openHistorical = useGame((s) => s.openHistorical)
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {historicalVignettes.map((h) => (
        <button
          key={h.id}
          onClick={() => openHistorical(h.id)}
          className="flex flex-col items-start gap-1 border border-mc-amber/30 bg-panel-fill p-2 text-left transition-colors hover:border-mc-amber hover:bg-mc-amber/5"
        >
          <span className="text-2xl">{h.thumbnail}</span>
          <span className="font-mono text-[11px] text-mc-amber">{h.title}</span>
          <span className="text-[10px] text-mc-text">{h.subtitle}</span>
          <span className="mt-auto text-[9px] uppercase tracking-widest text-mc-dim">
            {h.era}
          </span>
        </button>
      ))}
    </div>
  )
}

const DemoPlaceholder = ({ label }: { label: string }) => (
  <div className="flex h-48 items-center justify-center border border-dashed border-mc-cyan/30 bg-mc-cyan/5 font-mono text-[11px] text-mc-dim">
    Demo: {label} (interactive view available in mission / sandbox modes)
  </div>
)

export default function LearningTrackPlayer() {
  const idx = useGame((s) => s.learning.activeSection)
  const setSection = useGame((s) => s.setLearningSection)
  const markDone = useGame((s) => s.markLearningSectionDone)
  const completed = useGame((s) => s.learning.completed)
  const setScreen = useGame((s) => s.setScreen)
  const section = LEARNING_SECTIONS[idx]
  const problem = section?.problemId ? problemById(section.problemId) : undefined

  const renderDemo = () => {
    switch (section?.demoKind) {
      case 'historical_carousel':
        return <HistoricalCarousel />
      case 'three_phase_demo':
        return <DemoPlaceholder label="Three-phase walkthrough" />
      case 'rho_side_by_side':
        return <DemoPlaceholder label="ECI + RIC side-by-side views" />
      case 'ric_frame_demo':
        return <DemoPlaceholder label="Rotating RIC axis triad" />
      case 'cw_vs_kepler':
        return <DemoPlaceholder label="CW vs full Keplerian comparison" />
      case 'sandbox_perch':
      case 'sandbox_drift':
      case 'sandbox_nmc':
        return (
          <div className="border border-mc-cyan/30 bg-mc-cyan/5 p-3 text-xs">
            <div className="mb-1 font-mono text-mc-cyan">Live demo</div>
            <div className="text-mc-text">
              Open the Trajectory Sandbox from the main menu to interactively explore this
              trajectory family. The sandbox lets you sweep the parameter and watch the chase
              motion and required delta-V update live.
            </div>
            <Button
              onClick={() => setScreen('sandbox')}
              className="mt-2 !py-1 !text-[10px]"
            >
              Open Sandbox →
            </Button>
          </div>
        )
      case 'engagement_toggles':
        return <DemoPlaceholder label="Engagement overlays toggle demo" />
      case 'quiz':
        return <QuizDemo />
      default:
        return null
    }
  }

  const next = () => {
    markDone(idx)
    if (idx < LEARNING_SECTIONS.length - 1) setSection(idx + 1)
  }
  const prev = () => {
    if (idx > 0) setSection(idx - 1)
  }

  if (!section) return null

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center justify-between border-b border-mc-cyan/20 bg-panel-fill px-4 py-2">
        <div className="flex items-center gap-4">
          <span className="chip border-mc-amber/60 text-mc-amber">Learning Track</span>
          <span className="font-mono text-sm text-mc-text">{section.title}</span>
          <span className="font-mono text-xs text-mc-dim">
            Section {idx + 1} of {LEARNING_SECTIONS.length} · {section.estMinutes} min
          </span>
        </div>
        <Button onClick={() => setScreen('menu')}>✕ Close</Button>
      </header>
      <div className="flex min-h-0 flex-1">
        <LearningSidebar />
        <main className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-4 p-6">
            <div>
              <div className="font-mono text-2xl text-mc-cyan">{section.title}</div>
              {section.subtitle && (
                <div className="mt-1 font-mono text-sm text-mc-dim">{section.subtitle}</div>
              )}
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-mc-text">
              {section.body}
            </div>
            {section.citation && (
              <div className="text-[10px] text-mc-dim">Source: {section.citation}</div>
            )}
            {section.id === 'engagement' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">
                  Think across domains:
                </span>
                <CrossDomainCueChip cue={cueById['cdc_learning_cats']!} />
              </div>
            )}
            <div>{renderDemo()}</div>
            {problem && <ExampleProblemPanel problem={problem} />}
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-mc-cyan/20 pt-3">
              <Button onClick={prev} disabled={idx === 0}>
                ← Previous
              </Button>
              <span className="font-mono text-[10px] text-mc-dim">
                {completed.filter(Boolean).length} of {LEARNING_SECTIONS.length} sections complete
              </span>
              <Button
                onClick={next}
                variant="warn"
                disabled={idx === LEARNING_SECTIONS.length - 1}
              >
                Mark done & Next →
              </Button>
            </div>
            {idx === LEARNING_SECTIONS.length - 1 && (
              <Button
                onClick={() => {
                  markDone(idx)
                  setScreen('menu')
                }}
                variant="warn"
              >
                Mark done & finish →
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
