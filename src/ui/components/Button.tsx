import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'warn' | 'danger'
  children: ReactNode
  active?: boolean
}

export default function Button({
  variant = 'default',
  active = false,
  className = '',
  children,
  ...rest
}: Props) {
  const v =
    variant === 'warn' ? 'btn btn-warn' : variant === 'danger' ? 'btn btn-danger' : 'btn'
  // The active state must be unmistakable when used in segmented toggles (Map/Prox,
  // time-warp, scale preset, etc.). We use a saturated background + a glow ring +
  // a bold text-shadow so the selected option reads as obviously "on" at a glance.
  const act = active
    ? 'bg-mc-cyan/40 ring-2 ring-mc-cyan ring-offset-1 ring-offset-panel-fill text-mc-cyan shadow-glow'
    : ''
  return (
    <button className={`${v} ${act} ${className}`} {...rest}>
      {children}
    </button>
  )
}
