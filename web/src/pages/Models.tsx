import { ArrowUpRight, Database, RotateCw } from 'lucide-react'
import { useCatalog } from '@/lib/catalog'
import { LINKS } from '@/lib/links'
import { strings, usePrefs, useT } from '@/lib/prefs'
import { Ring } from '@/components/Ring'
import { Benchmark } from './models/Benchmark'
import { ModelList } from './models/ModelList'
import type { Row } from './models/shared'

const S = strings(
  {
    title: 'Models and benchmark',
    lede: 'Every text to speech model was fine-tuned on the same {hours} h of read Mooré from MooreSpeechCorporaV2, then evaluated on MooreSpeechBench by the same ASR model. CER is the share of characters the judge transcribes wrongly.',
    dataset: '{name} dataset',
    loading: 'Loading the models',
    error: 'The model list could not be loaded.',
    retry: 'Try again',
  },
  {
    title: 'Modèles et benchmark',
    lede: 'Chaque modèle de synthèse vocale a été affiné sur les mêmes {hours} h de mooré lu de MooreSpeechCorporaV2, puis évalué sur MooreSpeechBench par le même modèle ASR. Le CER est la part de caractères mal transcrits par le juge.',
    dataset: 'Jeu de données {name}',
    loading: 'Chargement des modèles',
    error: "La liste des modèles n'a pas pu être chargée.",
    retry: 'Réessayer',
  },
)

export default function Models() {
  const t = useT(S)
  const { lang } = usePrefs()
  const { catalog, error } = useCatalog()

  if (!catalog) {
    return (
      <div className="mx-auto grid min-h-[50vh] max-w-6xl place-items-center px-4" role="status" aria-live="polite">
        {error ? (
          <div className="max-w-sm text-center">
            <p className="text-text-2">{t.error}</p>
            <button
              type="button"
              onClick={() => location.reload()}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-field border border-border px-5 font-medium hover:border-border-strong"
            >
              <RotateCw className="size-4" aria-hidden="true" />
              {t.retry}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Ring id="faso-speech-lab" state="spin" className="size-14" />
            <span className="text-sm text-text-3">{t.loading}</span>
          </div>
        )}
      </div>
    )
  }

  const { benchmark, models } = catalog
  const rows = benchmark.rows as Row[]
  const name = benchmark.dataset.split('/').pop()!

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight">{t.title}</h1>
          <p className="mt-2 text-text-2">{t.lede.replace('{hours}', benchmark.hours.toLocaleString(lang))}</p>
        </div>
        <a
          href={LINKS.benchmark}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-field border border-border bg-surface px-4 text-sm font-medium hover:border-border-strong"
        >
          <Database className="size-4 text-accent" aria-hidden="true" />
          {t.dataset.replace('{name}', name)}
          <ArrowUpRight className="size-3.5 text-text-3" aria-hidden="true" />
        </a>
      </header>
      <Benchmark rows={rows} models={models} dataset={name} />
      <ModelList models={models} rows={rows} hours={benchmark.hours} />
    </div>
  )
}
