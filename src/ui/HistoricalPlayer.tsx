// HistoricalPlayer — cinema-mode player for the Historical Ops Library.
// Unlike mission Watch mode, this does NOT propagate physics. Each vignette
// is a set of hand-authored snapshots with schematic positions; we interpolate
// between adjacent snapshots for smooth motion and render narration from the
// current snapshot's block.
import { useEffect, useMemo, useState } from 'react'
import { useGame } from '../game/state'
import { historicalById } from '../historical'
import type { Snapshot } from '../historical/types'
import Button from './components/Button'
import Panel from './components/Panel'
import HistoricalScene3D from './HistoricalScene3D'

const SPEEDS: (0.5 | 1 | 2 | 4)[] = [0.5, 1, 2, 4]

export default function HistoricalPlayer() {
  const id = useGame((s) => s.activeHistoricalId)
  const snapIdx = useGame((s) => s.historicalSnapshotIdx)
  const playbackT = useGame((s) => s.historicalPlaybackTimeSec)
  const paused = useGame((s) => s.historicalPaused)
  const speed = useGame((s) => s.historicalSpeed)
  const promptIdx = useGame((s) => s.historicalPromptIdx)
  const instructorView = useGame((s) => s.historicalInstructorView)
  const setPaused = useGame((s) => s.setHistoricalPaused)
  const setSpeed = useGame((s) => s.setHistoricalSpeed)
  const setIdx = useGame((s) => s.setHistoricalSnapshot)
  const tick = useGame((s) => s.tickHistorical)
  const setPrompt = useGame((s) => s.setHistoricalPrompt)
  const toggleInstructor = useGame((s) => s.toggleInstructorView)
  const close = useGame((s) => s.closeHistorical)

  const vignette = id ? historicalById[id] ?? null : null
  const [lastTick, setLastTick] = useState<number | null>(null)
  const [, force] = useState(0)

  // rAF drive. Drives tick() (so the snapshot index advances) and force-
  // rerenders so the 3D scene picks up the new playbackT each frame.
  useEffect(() => {
    if (!vignette) return
    let raf = 0
    let prev: number | null = lastTick
    const loop = (now: number) => {
      const last = prev ?? now
      prev = now
      const realDt = Math.min(0.1, (now - last) / 1000)
      if (!paused) tick(realDt * speed)
      force((v) => v + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      setLastTick(prev)
      cancelAnimationFrame(raf)
    }
  }, [vignette, paused, speed, tick])

  // Advance snapshot index as playback time crosses each snapshot's t_sec.
  useEffect(() => {
    if (!vignette) return
    let newIdx = snapIdx
    for (let i = vignette.snapshots.length - 1; i >= 0; i--) {
      if (playbackT >= vignette.snapshots[i].t_sec) {
        newIdx = i
        break
      }
    }
    if (newIdx !== snapIdx) {
      setIdx(newIdx)
      // Auto-pause on snapshots that request it.
      const snap = vignette.snapshots[newIdx]
      if (snap.autoPauseAfter) setPaused(true)
    }
  }, [playbackT, snapIdx, vignette, setIdx, setPaused])

  // End of vignette: when playback passes beyond the last snapshot's t_sec.
  const totalDuration = vignette?.estimatedRuntimeSec ?? 1
  const atEnd = vignette ? playbackT >= totalDuration : false

  // Keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        setPaused(!paused)
      } else if (e.code === 'Escape') {
        close()
      } else if (e.code === 'ArrowRight' && atEnd) {
        if (vignette && promptIdx < vignette.discussionPrompts.length - 1)
          setPrompt(promptIdx + 1)
      } else if (e.code === 'ArrowLeft' && atEnd) {
        if (promptIdx > 0) setPrompt(promptIdx - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paused, setPaused, close, atEnd, vignette, promptIdx, setPrompt])

  const current: Snapshot | null = useMemo(
    () => (vignette ? vignette.snapshots[snapIdx] : null),
    [vignette, snapIdx],
  )

  if (!vignette) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Button onClick={close}>&larr; Menu</Button>
      </div>
    )
  }

  const scrubTo = (frac: number) => {
    const t = Math.max(0, Math.min(1, frac)) * totalDuration
    useGame.setState({ historicalPlaybackTimeSec: t })
    setPaused(true)
  }

  const activePrompt = atEnd ? vignette.discussionPrompts[promptIdx] : null

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center justify-between border-b border-mc-cyan/20 bg-panel-fill px-4 py-2">
        <div className="flex items-center gap-4">
          <span className="chip border-mc-amber/60 text-mc-amber">Historical Ops</span>
          <span className="font-mono text-sm text-mc-text">{vignette.title}</span>
          <span className="font-mono text-xs text-mc-dim">· {vignette.era}</span>
        </div>
        <Button onClick={close}>✕ Close</Button>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="relative flex min-w-0 flex-[7] flex-col border-r border-mc-cyan/20">
          <HistoricalScene3D
            vignette={vignette}
            snapshotIdx={snapIdx}
            playbackT={playbackT}
          />
          <div className="pointer-events-none absolute left-3 top-2 font-mono text-[10px] text-mc-dim">
            <div>{vignette.regime} · {vignette.era}</div>
            <div className="mt-0.5 opacity-70">Schematic — drag to rotate, scroll to zoom</div>
          </div>
        </div>
        <aside className="flex w-[360px] flex-[3] flex-col gap-2 bg-panel-fill p-2">
          {atEnd && activePrompt ? (
            <Panel
              title="Discussion"
              accessory={
                <button
                  onClick={toggleInstructor}
                  className="font-mono text-[10px] uppercase tracking-widest text-mc-cyan hover:underline"
                >
                  {instructorView ? 'Student view' : 'Instructor view'}
                </button>
              }
            >
              <div className="flex flex-col gap-3 p-3 text-xs">
                <div className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">
                  Prompt {promptIdx + 1} of {vignette.discussionPrompts.length}
                </div>
                <div className="text-sm leading-relaxed text-mc-text">
                  {activePrompt.question}
                </div>
                {instructorView && activePrompt.instructorNotes && (
                  <div className="mt-2 border border-mc-amber/50 bg-mc-amber/5 p-2 text-[11px] italic text-mc-amber">
                    Instructor notes: {activePrompt.instructorNotes}
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Button
                    onClick={() => setPrompt(Math.max(0, promptIdx - 1))}
                    disabled={promptIdx === 0}
                    className="!text-[10px]"
                  >
                    ← Prev
                  </Button>
                  <Button
                    onClick={() =>
                      setPrompt(
                        Math.min(vignette.discussionPrompts.length - 1, promptIdx + 1),
                      )
                    }
                    disabled={promptIdx === vignette.discussionPrompts.length - 1}
                    className="!text-[10px]"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </Panel>
          ) : (
            <Panel title="Narration">
              <div className="flex flex-col gap-2 p-3 text-xs">
                <div className="font-mono text-[10px] uppercase tracking-widest text-mc-cyan">
                  {current?.label}
                </div>
                <div className="font-mono text-sm text-mc-cyan">{current?.narration.title}</div>
                <div className="leading-relaxed text-mc-text">{current?.narration.body}</div>
                {current?.narration.operationalNote && (
                  <div className="mt-1 border border-mc-amber/50 bg-mc-amber/5 p-2 font-mono text-[11px] text-mc-amber">
                    {current.narration.operationalNote}
                  </div>
                )}
                {current?.narration.citation && (
                  <div className="text-[10px] text-mc-dim">{current.narration.citation}</div>
                )}
              </div>
            </Panel>
          )}

          {atEnd && (
            <Panel title="Outro">
              <div className="space-y-2 p-3 text-xs">
                <div className="font-mono text-mc-cyan">{vignette.outro.title}</div>
                <div className="leading-relaxed text-mc-text">{vignette.outro.body}</div>
                <div className="text-[10px] text-mc-dim">{vignette.outro.citation}</div>
              </div>
            </Panel>
          )}

          <Panel title="Playback">
            <div className="flex flex-col gap-2 p-3">
              <div className="flex gap-1">
                <Button
                  variant={paused ? 'warn' : 'default'}
                  onClick={() => setPaused(!paused)}
                  className="flex-1"
                >
                  {paused ? '▶ Play' : '❚❚ Pause'}
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <span className="panel-title mr-2">Speed</span>
                {SPEEDS.map((s) => (
                  <Button
                    key={s}
                    active={speed === s}
                    onClick={() => setSpeed(s)}
                    className="flex-1 !py-1 !text-[10px]"
                  >
                    {s}x
                  </Button>
                ))}
              </div>
              <div>
                <div className="mb-1 flex justify-between font-mono text-[10px] text-mc-dim">
                  <span>{playbackT.toFixed(0)}s</span>
                  <span>{totalDuration}s</span>
                </div>
                <div
                  className="relative h-2 cursor-pointer bg-mc-grid"
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect()
                    scrubTo((e.clientX - r.left) / r.width)
                  }}
                >
                  <div
                    className="h-full bg-mc-cyan"
                    style={{ width: `${Math.min(100, (playbackT / totalDuration) * 100)}%` }}
                  />
                  {vignette.snapshots.map((s) => (
                    <div
                      key={s.label}
                      className="absolute -top-1 h-3 w-0.5 bg-mc-amber"
                      style={{ left: `${(s.t_sec / totalDuration) * 100}%` }}
                      title={s.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Source">
            <div className="space-y-1 p-3 text-[11px]">
              <div className="text-mc-text">{vignette.primaryCitation.title}</div>
              <div className="text-mc-dim">{vignette.primaryCitation.source}</div>
              {vignette.primaryCitation.url && (
                <a
                  href={vignette.primaryCitation.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-mc-cyan hover:underline"
                >
                  {vignette.primaryCitation.url}
                </a>
              )}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
