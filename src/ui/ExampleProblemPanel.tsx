// Interactive numeric example problem. Cadet sees a scenario + variables,
// enters a numeric delta-V answer, system checks ±5% tolerance. Reveals the
// full worked solution after submission or on "Show Solution."
import { useState } from 'react'
import { useGame } from '../game/state'
import type { ExampleProblem } from '../learning/types'
import Button from './components/Button'

export default function ExampleProblemPanel({ problem }: { problem: ExampleProblem }) {
  const [input, setInput] = useState('')
  const [verdict, setVerdict] = useState<'pending' | 'correct' | 'wrong'>('pending')
  const [showSolution, setShowSolution] = useState(false)
  const recordAnswer = useGame((s) => s.recordProblemAnswer)
  const recorded = useGame((s) => s.learning.problemAnswers[problem.id])

  const submit = () => {
    const num = Number(input)
    if (Number.isNaN(num)) {
      setVerdict('wrong')
      return
    }
    const tol = problem.expectedAnswerMps * problem.toleranceFraction
    const correct = Math.abs(num - problem.expectedAnswerMps) <= tol
    setVerdict(correct ? 'correct' : 'wrong')
    setShowSolution(true)
    recordAnswer(problem.id, correct)
  }

  const reset = () => {
    setInput('')
    setVerdict('pending')
    setShowSolution(false)
  }

  return (
    <div className="border border-mc-amber/50 bg-mc-amber/5 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="font-mono text-sm text-mc-amber">{problem.title}</div>
        {recorded && (
          <span
            className={`chip ${recorded.correct ? 'border-mc-green/60 text-mc-green' : 'border-mc-red/60 text-mc-red'}`}
          >
            {recorded.correct ? (recorded.firstTry ? '✓ First try' : '✓ Solved') : '✕ Try again'}
          </span>
        )}
      </div>
      <div className="mb-3 whitespace-pre-wrap text-xs leading-relaxed text-mc-text">
        {problem.setup}
      </div>
      <div className="mb-3 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 border-l-2 border-mc-amber/40 pl-3 font-mono text-[11px]">
        {problem.variables.map((v) => (
          <div key={v.label} className="contents">
            <span className="text-mc-dim">{v.label}</span>
            <span className="text-mc-text">{v.value}</span>
          </div>
        ))}
      </div>
      <div className="mb-2 flex items-center gap-2">
        <label className="flex flex-1 items-center gap-2 font-mono text-xs">
          <span className="text-mc-dim">Your answer ({problem.unit}):</span>
          <input
            type="number"
            step="0.01"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-24 border border-mc-cyan/40 bg-transparent px-2 py-1 text-right font-mono text-mc-text"
            disabled={verdict === 'correct'}
          />
        </label>
        <Button onClick={submit} variant="warn" className="!py-1 !text-[10px]" disabled={!input}>
          Submit
        </Button>
        <Button onClick={reset} className="!py-1 !text-[10px]">
          Reset
        </Button>
      </div>
      {verdict === 'correct' && (
        <div className="mb-2 border border-mc-green/50 bg-mc-green/10 p-2 font-mono text-[11px] text-mc-green">
          ✓ Correct. Expected ≈ {problem.expectedAnswerMps.toFixed(2)} {problem.unit} (±{(problem.toleranceFraction * 100).toFixed(0)}%).
        </div>
      )}
      {verdict === 'wrong' && (
        <div className="mb-2 border border-mc-red/50 bg-mc-red/10 p-2 font-mono text-[11px] text-mc-red">
          ✕ Not within tolerance. Expected ≈ {problem.expectedAnswerMps.toFixed(2)} {problem.unit}. Review the worked solution below and try again.
        </div>
      )}
      <Button
        onClick={() => setShowSolution((s) => !s)}
        className="!py-1 !text-[10px]"
      >
        {showSolution ? 'Hide solution' : 'Show solution'}
      </Button>
      {showSolution && (
        <div className="mt-2 border border-mc-cyan/30 bg-panel-bg/40 p-3 text-xs leading-relaxed">
          <div className="panel-title mb-2">Worked solution</div>
          <div className="whitespace-pre-wrap text-mc-text">{problem.workedSolution}</div>
          {problem.citation && (
            <div className="mt-2 text-[10px] text-mc-dim">Source: {problem.citation}</div>
          )}
        </div>
      )}
    </div>
  )
}
