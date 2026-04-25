import type { ReactNode } from 'react'

interface Props {
  title?: string
  children: ReactNode
  className?: string
  accessory?: ReactNode
}

export default function Panel({ title, children, className = '', accessory }: Props) {
  return (
    <div className={`panel flex flex-col ${className}`}>
      {(title || accessory) && (
        <div className="flex items-center justify-between border-b border-mc-cyan/20 px-3 py-1.5">
          {title ? <div className="panel-title">{title}</div> : <div />}
          {accessory}
        </div>
      )}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
