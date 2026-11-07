import { Link } from 'react-router'
import { ArrowRight, Mic } from 'lucide-react'
import { useCatalog } from '@/lib/catalog'
import { strings, useT } from '@/lib/prefs'
import { cer, DeviceTag, pct } from '@/components/ModelPicker'
import { Ring } from '@/components/Ring'

const S = strings(
  {
    title: 'Models in the lab',
    lede: 'Character error rate on the MooreSpeechBench v1.0 test split, judged by ASR. Lower is better.',
    link: 'Models and benchmark',
    real: 'Real recordings',
    test: 'Test CER',
    asr: 'Speech to text',
    judge: 'dev CER, judge 1 of the benchmark',
    axis: 'Test CER per model',
  },
  {
    title: 'Les modèles du labo',
    lede: "Taux d'erreur sur les caractères sur la partition test de MooreSpeechBench v1.0, jugé par ASR. Plus bas est meilleur.",
    link: 'Modèles et benchmark',
    real: 'Enregistrements réels',
    test: 'CER test',
    asr: 'Transcription',
    judge: 'CER dev, juge 1 du benchmark',
    axis: 'CER test par modèle',
  },
)

export function Lab() {
  const t = useT(S)
  const { catalog } = useCatalog()
  if (!catalog) return null
  const tts = catalog.models.filter((m) => m.task === 'tts' && m.scores.test != null).sort((a, b) => a.scores.test - b.scores.test)
  const asr = catalog.models.find((m) => m.task === 'asr')
  const real = catalog.benchmark.rows.find((r) => r.reference)?.test
  const max = Math.max(1, Math.ceil(Math.max(...tts.map((m) => m.scores.test), real ?? 0)))
  const at = (v: number) => `${(v / max) * 100}%`

  return (
    <section aria-labelledby="lab-title" className="mx-auto max-w-6xl px-4 pb-20 pt-16 md:pt-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="lab-title" className="text-2xl font-extrabold tracking-tight md:text-3xl">
            {t.title}
          </h2>
          <p className="mt-1.5 max-w-xl text-text-2">{t.lede}</p>
        </div>
        <Link to="/models" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-accent hover:underline hover:underline-offset-4">
          {t.link}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-card border border-border bg-surface p-5 md:p-6">
          <ul aria-label={t.axis}>
            {tts.map((m) => (
              <li key={m.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-b border-border py-3 last:border-b-0 sm:grid-cols-[13rem_minmax(0,1fr)_4.5rem]">
                <div className="flex min-w-0 items-center gap-3">
                  <Ring id={m.id} bars={28} state="on" className="size-8" />
                  <div className="min-w-0">
                    <b className="block truncate">{m.name}</b>
                    <span className="text-xs text-text-3">
                      <DeviceTag model={m} />
                    </span>
                  </div>
                </div>
                <div aria-hidden="true" className="relative col-span-2 row-start-2 mt-2 h-6 sm:col-span-1 sm:row-start-auto sm:mt-0">
                  <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-border-strong" />
                  {real != null && (
                    <span className="absolute inset-y-0 border-l-[1.5px] border-text-2" style={{ left: at(real) }} />
                  )}
                  <span className="absolute top-1/2 -ml-1.5 -mt-1.5 size-3 rounded-full bg-accent shadow-[0_0_0_3px_var(--surface)]" style={{ left: at(m.scores.test) }} />
                </div>
                <span className="text-right font-mono font-semibold tabular-nums">{pct(m.scores.test)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-sm font-semibold text-text-2">
            <span className="flex items-center gap-2">
              <i className="size-2.5 rounded-full bg-accent" />
              {t.test}
            </span>
            {real != null && (
              <span className="flex items-center gap-2">
                <i className="h-3 border-l-[1.5px] border-text-2" />
                {t.real}, <span className="font-mono">{pct(real)}</span>
              </span>
            )}
          </div>
        </div>

        {asr && (
          <div className="flex flex-col gap-3 rounded-card border border-border bg-surface-2 p-5 md:p-6">
            <span className="inline-flex items-center gap-2 self-start rounded-field bg-accent-soft px-3 py-1 text-sm font-semibold text-accent">
              <Mic className="size-4" aria-hidden="true" />
              {t.asr}
            </span>
            <b className="text-lg">{asr.name}</b>
            <p className="text-sm text-text-2">{asr.base}</p>
            <p className="mt-auto flex items-baseline gap-2">
              <span className="whitespace-nowrap font-mono text-3xl font-semibold tabular-nums">{pct(cer(asr).value)}</span>
              <span className="text-sm text-text-3">{t.judge}</span>
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
