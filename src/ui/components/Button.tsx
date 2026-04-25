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
  const act = active ? 'bg-mc-cyan/20 ring-1 ring-mc-cyan' : ''
  return (
    <button className={`${v} ${act} ${className}`} {...rest}>
      {children}
    </button>
  )
}
