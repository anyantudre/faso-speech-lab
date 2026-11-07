import type { ReactNode } from 'react'
import { Cpu, Zap } from 'lucide-react'
import type { Model } from '@/lib/api'
import { useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'
import { S } from './shared'

export function Tag({ tone = 'plain', className, children }: { tone?: 'plain' | 'ok' | 'warn'; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-field border px-2.5 py-0.5 text-xs font-medium',
        tone === 'plain' && 'border-border text-text-2',
        tone === 'ok' && 'border-transparent bg-accent-soft text-accent-strong',
        tone === 'warn' && 'border-transparent bg-warn-soft text-warn',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function DeviceTag({ model, long }: { model: Model; long?: boolean }) {
  const t = useT(S)
  const Icon = model.device === 'gpu' ? Zap : Cpu
  const label = long ? (model.device === 'cpu' ? t.runsCpu : model.available ? t.runsGpu : t.needsGpu) : model.device === 'gpu' ? t.gpu : t.cpu
  return (
    <Tag tone={model.available ? 'ok' : 'warn'}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </Tag>
  )
}
