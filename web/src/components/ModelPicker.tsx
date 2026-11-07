import { useId, useState } from 'react'
import { ChevronDown, Cpu, Gpu, Zap } from 'lucide-react'
import type { Model } from '@/lib/api'
import { strings, useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'

const S = strings(
  {
    model: 'Model',
    recommended: 'Recommended',
    needsGpu: 'Needs a GPU',
    cloning: 'Voice cloning',
    voices: 'fixed voices',
    all: 'All models',
    fewer: 'Show fewer',
    test: 'test CER',
    dev: 'dev CER',
  },
  {
    model: 'Modèle',
    recommended: 'Recommandé',
    needsGpu: 'Nécessite un GPU',
    cloning: 'Clonage de voix',
    voices: 'voix fixes',
    all: 'Tous les modèles',
    fewer: 'Afficher moins',
    test: 'CER test',
    dev: 'CER dev',
  },
)

const SHOWN = 2

export function cer(m: Model): { value?: number; split: 'test' | 'dev' } {
  return m.scores.test != null ? { value: m.scores.test, split: 'test' } : { value: m.scores.dev, split: 'dev' }
}

export const pct = (v?: number) => (v == null ? '-' : `${v.toFixed(2)} %`)

/** Default model first, then runnable ones by score: the first two are shown, the rest one click away. */
function rank(models: Model[]) {
  const score = (m: Model) => cer(m).value ?? Infinity
  return [...models].sort((a, b) => Number(b.default) - Number(a.default) || Number(b.available) - Number(a.available) || score(a) - score(b))
}

type Props = { models: Model[]; value: string; onChange: (id: string) => void; className?: string }

export function ModelPicker({ models, value, onChange, className }: Props) {
  const t = useT(S)
  const name = useId()
  const [open, setOpen] = useState(false)
  const ranked = rank(models)
  const extra = ranked.length - SHOWN
  const shown = open ? ranked : ranked.filter((m, i) => i < SHOWN || m.id === value)

  return (
    <div role="radiogroup" aria-labelledby={name} className={cn('grid gap-2', className)}>
      <span id={name} className="mb-1 text-xs font-bold uppercase tracking-wider text-text-3">
        {t.model}
      </span>
      {shown.map((m) => (
        <Option key={m.id} model={m} name={name} checked={m.id === value} onChange={() => onChange(m.id)} />
      ))}
      {extra > 0 && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex h-11 items-center justify-center gap-1.5 rounded-field text-sm font-semibold text-text-2 hover:bg-surface-2 hover:text-text"
        >
          {open ? t.fewer : `${t.all} (${ranked.length})`}
          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

function Option({ model: m, name, checked, onChange }: { model: Model; name: string; checked: boolean; onChange: () => void }) {
  const t = useT(S)
  const score = cer(m)
  return (
    <label
      className={cn(
        'relative grid cursor-pointer grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-field border bg-surface px-3 py-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
        checked ? 'border-accent bg-accent-soft' : 'border-border hover:border-border-strong',
      )}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span aria-hidden="true" className={cn('grid size-4 place-items-center rounded-full border-[1.5px]', checked ? 'border-accent' : 'border-border-strong')}>
        {checked && <span className="size-2 rounded-full bg-accent" />}
      </span>
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <b className={cn('font-semibold', !m.available && 'text-text-2')}>{m.name}</b>
        {m.default && <span className="rounded-field bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-fg">{t.recommended}</span>}
      </span>
      <span className="text-right font-mono text-sm tabular-nums">
        {pct(score.value)}
        <small className="block text-[11px] text-text-3">{t[score.split]}</small>
      </span>
      <span className="col-start-2 col-end-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-3">
        <DeviceTag model={m} />
        {m.task === 'tts' && <span>{m.cloning ? t.cloning : `${m.voices.length} ${t.voices}`}</span>}
      </span>
    </label>
  )
}

export function DeviceTag({ model: m }: { model: Model }) {
  const t = useT(S)
  if (!m.available)
    return (
      <span className="inline-flex items-center gap-1 rounded-field bg-warn-soft px-2 py-0.5 font-semibold text-warn">
        <Gpu className="size-3.5" aria-hidden="true" />
        {t.needsGpu}
      </span>
    )
  const Icon = m.device === 'gpu' ? Zap : Cpu
  return (
    <span className="inline-flex items-center gap-1 font-mono uppercase">
      <Icon className="size-3.5" aria-hidden="true" />
      {m.device}
    </span>
  )
}
