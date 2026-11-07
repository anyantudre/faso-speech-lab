import { useEffect, useId, useState, type ReactNode, type RefObject } from 'react'
import { AudioLines } from 'lucide-react'
import { Ring } from './Ring'
import { strings, useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'

export const MAX_CHARS = 500

const S = strings(
  {
    label: 'Text in Mooré',
    placeholder: 'Type a sentence in Mooré here…',
    try: 'Try',
    generate: 'Generate speech',
    g0: 'love one another deeply',
    g1: 'all return to the dust',
    g2: 'the tree grew strong',
    g3: 'be happy and do good',
  },
  {
    label: 'Texte en mooré',
    placeholder: 'Tapez une phrase en mooré ici…',
    try: 'Essayez',
    generate: 'Générer la voix',
    g0: 'aimez-vous profondément',
    g1: 'tous retournent à la poussière',
    g2: "l'arbre devint fort",
    g3: 'être heureux et faire le bien',
  },
)

/** Sentences from the MooreSpeechBench test sets (read speech, mostly Bible verses). */
const SUGGESTIONS = [
  'Sẽn yɩɩda, bɩ y nong taab wʋsgo, bala nonglem luta yel-wẽn wʋsgo.',
  'B fãa rabda zĩ-yɛnga. B fãa yii tẽng tomẽ, la b fãa lebda tomẽ.',
  "Tɩɩgã bɩɩme n paam pãnga, t'a zugã tat saasã. B ra tõe n paa dũniyã kɩremsã fãa n yã-a.",
  'Mam bãngame tɩ bũmb pa be n são ne ãdem-biisã n yɩɩd b sẽn na n noog b sũur la b maan neer b vɩɩmã sasa.',
] as const

/** First words of a sentence, for a compact chip. */
const opening = (text: string) => text.split(' ').slice(0, 4).join(' ').replace(/[,.]$/, '') + '…'

/** Benchmark sentences with a short gloss in the UI language. */
export function useSuggestions() {
  const t = useT(S)
  const glosses = [t.g0, t.g1, t.g2, t.g3]
  return SUGGESTIONS.map((text, i) => ({ text, short: opening(text), gloss: glosses[i] }))
}

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** Ghost text that types itself, line after line, while `on`. */
function useGhost(lines: readonly string[], on: boolean) {
  const [still] = useState(reduced)
  const [shown, setShown] = useState(still ? lines[0] : '')
  useEffect(() => {
    if (!on || still) return
    let line = 0
    let n = 0
    let back = false
    let timer: number
    const tick = () => {
      const full = lines[line]
      n += back ? -1 : 1
      setShown(full.slice(0, n))
      let wait = back ? 25 : 70
      if (!back && n === full.length) [back, wait] = [true, 2200]
      else if (back && n === 0) [back, line, wait] = [false, (line + 1) % lines.length, 500]
      timer = window.setTimeout(tick, wait)
    }
    timer = window.setTimeout(tick, 400)
    return () => clearTimeout(timer)
  }, [lines, on, still])
  return shown
}

type FieldProps = { value: string; onChange: (text: string) => void; onSubmit?: () => void; className?: string }

/** Mooré textarea that stays highlighted and shows a typing hint until something is written. */
export function MooreField({ value, onChange, onSubmit, className }: FieldProps) {
  const t = useT(S)
  const id = useId()
  const [focused, setFocused] = useState(false)
  const [lines] = useState(() => [t.placeholder, ...SUGGESTIONS])
  const ghost = useGhost(lines, !value)
  const box = 'moore px-4 py-3 text-lg leading-relaxed'
  return (
    <div className={cn('relative', className)}>
      <label className="sr-only" htmlFor={id}>
        {t.label}
      </label>
      <textarea
        id={id}
        lang="mos"
        value={value}
        maxLength={MAX_CHARS}
        rows={4}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) onSubmit?.()
        }}
        className={cn(
          box,
          'block min-h-32 w-full resize-y rounded-field border bg-bg text-text outline-none transition-[border-color,box-shadow]',
          value ? 'border-border-strong focus:border-accent' : 'border-accent shadow-[0_0_0_4px_var(--accent-soft)]',
          'focus:shadow-[0_0_0_4px_var(--accent-soft)]',
        )}
      />
      {!value && (
        <div aria-hidden="true" className={cn(box, 'pointer-events-none absolute inset-0 border border-transparent text-text-3')}>
          {ghost}
          {!focused && <span className="caret" />}
        </div>
      )}
    </div>
  )
}

type Props = {
  text: string
  onText: (text: string) => void
  onGenerate: () => void
  voiceId: string
  voiceLabel: string
  modelName: string
  ring?: 'idle' | 'busy' | 'spin'
  disabled?: boolean
  ringRef?: RefObject<HTMLSpanElement | null>
  bar?: ReactNode
  status?: ReactNode
  className?: string
}

/** Mooré text card: voice ring, text, suggestions, count and the Generate speech button. */
export function Composer({ text, onText, onGenerate, voiceId, voiceLabel, modelName, ring = 'idle', disabled, ringRef, bar, status, className }: Props) {
  const t = useT(S)
  const suggestions = useSuggestions()
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onGenerate()
      }}
      className={cn('rounded-card border border-border bg-surface shadow-lift', className)}
    >
      <div className="grid gap-4 p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-7 sm:p-6">
        <div className="flex items-center gap-3 sm:w-32 sm:flex-col sm:gap-2.5 sm:text-center">
          <span ref={ringRef} className="inline-flex">
            <Ring id={voiceId} state={ring === 'idle' ? 'on' : ring} className="size-14 sm:size-28" />
          </span>
          <div className="min-w-0">
            <b className="block truncate text-sm">{voiceLabel}</b>
            <small className="block truncate text-xs font-semibold text-text-3">{modelName}</small>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3.5">
          <MooreField value={text} onChange={onText} onSubmit={onGenerate} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-wider text-text-3">{t.try}</span>
            {suggestions.map((s) => (
              <button
                key={s.text}
                type="button"
                onClick={() => onText(s.text)}
                className="inline-flex min-h-11 items-center gap-2 rounded-field border border-border bg-surface-2 px-3.5 text-sm hover:border-border-strong"
              >
                <span className="moore" lang="mos" title={s.text}>
                  {s.short}
                </span>
                <span className="text-xs text-text-3">{s.gloss}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3 sm:px-5">
        {bar}
        <span className="ml-auto font-mono text-xs tabular-nums text-text-3">
          {text.length} / {MAX_CHARS}
        </span>
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-field bg-accent px-6 font-bold text-accent-fg transition hover:bg-accent-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <AudioLines className="size-5" aria-hidden="true" />
          {t.generate}
        </button>
      </div>
      <div role="status" className={cn('text-sm', status != null && 'px-4 pb-4 sm:px-5')}>
        {status}
      </div>
    </form>
  )
}
