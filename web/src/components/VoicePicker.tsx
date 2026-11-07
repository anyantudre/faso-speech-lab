import { useId } from 'react'
import { Info, Mic } from 'lucide-react'
import type { Model } from '@/lib/api'
import { voiceUrl } from '@/lib/api'
import { Player } from './Player'
import { Ring } from './Ring'
import { strings, useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'

const S = strings(
  {
    voice: 'Voice',
    readers: 'readers',
    reference: 'Reference voice',
    clips: 'clips',
    voiceN: 'Voice',
    mixed: 'Mixed',
    referenceN: 'Reference',
    own: 'Your clip',
    yours: 'Yours',
    note: 'Each voice is a reader from the training data. "Mixed" pools several minor readers.',
  },
  {
    voice: 'Voix',
    readers: 'lecteurs',
    reference: 'Voix de référence',
    clips: 'extraits',
    voiceN: 'Voix',
    mixed: 'Mixte',
    referenceN: 'Référence',
    own: 'Votre extrait',
    yours: 'La vôtre',
    note: "Chaque voix est un lecteur des données d'entraînement. « Mixte » regroupe plusieurs lecteurs secondaires.",
  },
)

export const OWN = 'own'

/** Short and full labels of a voice: "04" / "Voice 04" for fixed voices, "2" / "Reference 2" for clips. */
export function useVoiceLabel() {
  const t = useT(S)
  return (model: Model, voice: string) => {
    if (voice === OWN) return { short: t.yours, full: t.own }
    if (model.cloning) {
      const n = String(model.voices.indexOf(voice) + 1)
      return { short: n, full: `${t.referenceN} ${n}` }
    }
    if (voice === 'Vmisc') return { short: t.mixed, full: t.mixed }
    const n = voice.replace(/^V/, '')
    return { short: n, full: `${t.voiceN} ${n}` }
  }
}

type Props = { model: Model; value: string; onChange: (voice: string) => void; className?: string }

export function VoicePicker({ model, value, onChange, className }: Props) {
  const t = useT(S)
  const label = useVoiceLabel()
  const id = useId()
  const options = model.cloning ? [...model.voices, OWN] : model.voices
  const ref = model.cloning ? model.voices.indexOf(value) : -1

  return (
    <div className={cn('grid gap-3', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span id={id} className="text-xs font-bold uppercase tracking-wider text-text-3">
          {model.cloning ? t.reference : t.voice}
        </span>
        <span className="text-xs text-text-3">
          {model.voices.length} {model.cloning ? t.clips : t.readers}
        </span>
      </div>
      <div role="group" aria-labelledby={id} className="grid grid-cols-[repeat(auto-fill,minmax(3.75rem,1fr))] gap-1">
        {options.map((v) => {
          const on = v === value
          const l = label(model, v)
          return (
            <button
              key={v}
              type="button"
              aria-pressed={on}
              aria-label={l.full}
              title={l.full}
              onClick={() => onChange(v)}
              className={cn(
                'group flex min-h-11 flex-col items-center gap-1 rounded-field border px-1 pb-1.5 pt-2 text-xs font-bold transition-colors',
                on ? 'border-accent/40 bg-accent-soft text-text' : 'border-transparent text-text-2 hover:bg-surface-2',
              )}
            >
              {v === OWN ? (
                <span className={cn('grid size-9 place-items-center rounded-field border border-dashed', on ? 'border-accent text-accent' : 'border-border-strong')}>
                  <Mic className="size-4" aria-hidden="true" />
                </span>
              ) : (
                <Ring id={v} bars={28} state={on ? 'on' : 'idle'} className={cn('size-9 transition-colors', !on && 'group-hover:text-text-2')} />
              )}
              <span className="max-w-full truncate">{l.short}</span>
            </button>
          )
        })}
      </div>
      {ref >= 0 && <Player key={value} url={voiceUrl(model.id, ref)} synthetic={false} compact />}
      {!model.cloning && (
        <p className="flex gap-2 text-xs text-text-3">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          {t.note}
        </p>
      )}
    </div>
  )
}
