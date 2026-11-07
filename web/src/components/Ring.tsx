import { useMemo } from 'react'
import { ringBars } from '@/lib/ring'
import { cn } from '@/lib/cn'

type Props = { id: string; bars?: number; className?: string; state?: 'idle' | 'on' | 'busy' | 'spin' | 'bloom' }

/** Voice signature ring. Colour comes from `currentColor`; `on` uses the accent. */
export function Ring({ id, bars = 44, className, state = 'idle' }: Props) {
  const shape = useMemo(() => ringBars(id, bars), [id, bars])
  return (
    <span
      aria-hidden="true"
      className={cn(
        'vring inline-block shrink-0 leading-none',
        state === 'idle' ? 'text-[var(--ring-idle)]' : 'text-accent',
        state !== 'idle' && state !== 'on' && state,
        className,
      )}
    >
      <svg viewBox="0 0 100 100">
        {shape.map((b, i) => (
          <g key={i} transform={`rotate(${b.deg.toFixed(2)} 50 50)`}>
            <rect className="rb" style={{ ['--i' as string]: i }} x="48.9" y={b.y.toFixed(2)} width="2.2" height={b.len.toFixed(2)} rx="1.1" fill="currentColor" />
          </g>
        ))}
        <circle cx="50" cy="50" r="3.2" fill="currentColor" />
      </svg>
    </span>
  )
}
