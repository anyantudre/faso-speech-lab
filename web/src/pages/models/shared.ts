import type { BenchRow } from '@/lib/api'
import { strings, usePrefs, type Lang } from '@/lib/prefs'

export type Row = BenchRow & { repo?: string }

export const S = strings(
  {
    cpu: 'CPU',
    gpu: 'GPU',
    runsCpu: 'Runs on CPU',
    runsGpu: 'Runs on GPU',
    needsGpu: 'Needs a GPU',
    available: 'Available here',
    benchOnly: 'Benchmark only',
    reference: 'Reference',
    real: 'Real recordings',
    realSub: 'test set audio',
    hfModel: 'Hugging Face model',
  },
  {
    cpu: 'CPU',
    gpu: 'GPU',
    runsCpu: 'Tourne sur CPU',
    runsGpu: 'Tourne sur GPU',
    needsGpu: 'Demande un GPU',
    available: 'Disponible ici',
    benchOnly: 'Benchmark seulement',
    reference: 'Référence',
    real: 'Enregistrements réels',
    realSub: 'audio du jeu de test',
    hfModel: 'Modèle Hugging Face',
  },
)

export const pct = (v: number, lang: Lang, digits = 2) =>
  `${v.toLocaleString(lang, { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`

export function usePct() {
  const { lang } = usePrefs()
  return (v: number, digits?: number) => pct(v, lang, digits)
}
