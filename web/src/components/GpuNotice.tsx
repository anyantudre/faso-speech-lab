import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Gpu } from 'lucide-react'
import type { Model } from '@/lib/api'
import { sampleUrl } from '@/lib/api'
import { Player } from './Player'
import { strings, useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'

const S = strings(
  {
    title: 'needs a GPU',
    body: 'This Space runs on a free CPU, so the model is not running here yet. You can still play samples from its model card.',
    samples: 'Samples from the model card',
    sample: 'Sample',
    scores: 'See its scores',
  },
  {
    title: 'nécessite un GPU',
    body: "Cet espace tourne sur un CPU gratuit : le modèle n'est donc pas encore actif ici. Vous pouvez quand même écouter les exemples de sa fiche.",
    samples: 'Exemples de la fiche du modèle',
    sample: 'Exemple',
    scores: 'Voir ses scores',
  },
)

export function GpuNotice({ model, className }: { model: Model; className?: string }) {
  const t = useT(S)
  const [n, setN] = useState(0)
  return (
    <div className={cn('grid gap-3 rounded-field border border-border bg-surface-2 p-4', className)}>
      <div className="flex gap-3">
        <Gpu className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden="true" />
        <div>
          <h3 className="font-bold">
            {model.name} {t.title}
          </h3>
          <p className="mt-1 text-sm text-text-2">{t.body}</p>
        </div>
      </div>
      {model.samples.length > 0 && (
        <>
          <div role="group" aria-label={t.samples} className="flex flex-wrap gap-1.5">
            {model.samples.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={n === i}
                aria-label={`${t.sample} ${i + 1}`}
                onClick={() => setN(i)}
                className={cn('size-11 rounded-field border font-mono text-sm', n === i ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-2 hover:border-border-strong')}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <Player key={n} url={sampleUrl(model.id, n)} />
        </>
      )}
      <Link to="/models" className="inline-flex min-h-11 items-center gap-1.5 justify-self-start text-sm font-semibold text-accent">
        {t.scores}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  )
}
