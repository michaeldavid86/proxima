import { useEffect, useRef, useState } from 'react'
import { useGame } from '../game/state'
import { buildMissionLog, fetchCoachResponse } from '../api/coach-client'
import Button from './components/Button'

export default function CoachModal({ onClose }: { onClose: () => void }) {
  const state = useGame()
  const coachReq = useGame((s) => s.coachRequest)
  const setCoachRequest = useGame((s) => s.setCoachRequest)
  const [attempt, setAttempt] = useState(0)
  const runOnce = useRef(false)

  useEffect(() => {
    if (runOnce.current) return
    runOnce.current = true
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const run = async () => {
    setCoachRequest({ status: 'pending', response: null, error: null })
    const log = buildMissionLog(state)
    if (!log) {
      setCoachRequest({
        status: 'error',
        error: 'No mission log available to debrief.',
      })
      return
    }
    try {
      const resp = await fetchCoachResponse(log)
      setCoachRequest({ status: 'success', response: resp.coach, error: null })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setCoachRequest({ status: 'error', error: msg })
    }
  }

  const retry = () => {
    setAttempt((a) => a + 1)
    void run()
  }

  const onCopy = async () => {
    if (!coachReq.response) return
    try {
      await navigator.clipboard.writeText(coachReq.response)
    } catch {
      /* ignore */
    }
  }

  const onSave = () => {
    if (!coachReq.response) return
    const blob = new Blob([coachReq.response], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `proxima-coach-${state.mission?.id ?? 'mission'}-${attempt + 1}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="flex max-h-[85vh] w-full max-w-[720px] flex-col border border-mc-cyan/50 bg-panel-fill shadow-glow">
        <header className="flex items-center justify-between border-b border-mc-cyan/20 px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="chip border-mc-cyan/60 text-mc-cyan">AI Coach</span>
            <span className="panel-title">Flight Debrief</span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-mc-dim">
            {state.mission?.name}
          </span>
        </header>
        <div className="flex-1 overflow-y-auto p-6 text-sm leading-relaxed">
          {coachReq.status === 'pending' && (
            <div className="flex items-center gap-3 font-mono text-mc-amber">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-mc-amber" />
              Coach is reviewing your flight...
            </div>
          )}
          {coachReq.status === 'error' && (
            <div className="space-y-2">
              <div className="text-mc-red">Coach is unavailable right now. Your flight data is still saved.</div>
              <div className="font-mono text-[10px] text-mc-dim">{coachReq.error}</div>
            </div>
          )}
          {coachReq.status === 'success' && coachReq.response && (
            <div className="whitespace-pre-wrap text-mc-text">{coachReq.response}</div>
          )}
        </div>
        <footer className="flex items-center justify-between gap-2 border-t border-mc-cyan/20 p-3">
          <span className="font-mono text-[10px] text-mc-dim">
            Response is stateless. Nothing is stored server-side.
          </span>
          <div className="flex gap-2">
            {coachReq.status === 'error' && (
              <Button onClick={retry} variant="warn" className="!text-[10px]">
                Retry
              </Button>
            )}
            {coachReq.status === 'success' && (
              <>
                <Button onClick={onCopy} className="!text-[10px]">
                  Copy
                </Button>
                <Button onClick={onSave} className="!text-[10px]">
                  Save .txt
                </Button>
              </>
            )}
            <Button onClick={onClose} className="!text-[10px]">
              Close
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}
