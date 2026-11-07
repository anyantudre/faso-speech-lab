import { useEffect, useState } from 'react'
import type { Model } from '@/lib/api'
import { strings, useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'
import { S as Shared, usePct, type Row } from './shared'
import { DeviceTag, Tag } from './Tags'

const S = strings(
  {
    title: 'Benchmark',
    split: 'Split shown on the plot',
    both: 'both',
    keyTest: 'test',
    keyUnseen: 'test_unseen, new voices',
    keyReal: 'real recordings',
    lower: 'CER, lower is better',
    caption: 'Character error rate of the ASR judge per model on',
    model: 'Model',
    axis: 'CER on a shared axis',
    runs: 'Runs on',
    space: 'In this Space',
    notReported: 'not reported',
    region: 'Benchmark table, scrolls sideways on small screens',
    below: '{names} scores below real recordings. That means the ASR judge reads the clip more easily, not that it sounds more natural than a person.',
    belowMany: '{names} score below real recordings. That means the ASR judge reads the clips more easily, not that they sound more natural than a person.',
    only: '{names} are scored in the benchmark but not served in this Space.',
    and: 'and',
  },
  {
    title: 'Benchmark',
    split: 'Partition affichée sur le graphique',
    both: 'les deux',
    keyTest: 'test',
    keyUnseen: 'test_unseen, nouvelles voix',
    keyReal: 'enregistrements réels',
    lower: 'CER, plus bas est meilleur',
    caption: "Taux d'erreur sur les caractères du juge ASR par modèle sur",
    model: 'Modèle',
    axis: 'CER sur un axe commun',
    runs: 'Matériel',
    space: 'Dans ce Space',
    notReported: 'non publié',
    region: 'Tableau du benchmark, défile horizontalement sur petit écran',
    below: "{names} obtient un score inférieur aux enregistrements réels. Cela veut dire que le juge ASR lit le clip plus facilement, pas qu'il sonne plus naturel qu'une personne.",
    belowMany: "{names} obtiennent un score inférieur aux enregistrements réels. Cela veut dire que le juge ASR lit les clips plus facilement, pas qu'ils sonnent plus naturels qu'une personne.",
    only: '{names} sont évalués dans le benchmark mais ne sont pas servis dans ce Space.',
    and: 'et',
  },
)

type Split = 'both' | 'test' | 'test_unseen'

const join = (names: string[], and: string) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} ${and} ${names.at(-1)}`)
const fill = (template: string, names: string[], and: string) => template.replace('{names}', join(names, and))

export function Benchmark({ rows, models, dataset }: { rows: Row[]; models: Model[]; dataset: string }) {
  const t = useT(S)
  const s = useT(Shared)
  const fmt = usePct()
  const [split, setSplit] = useState<Split>('both')
  const [placed, setPlaced] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setPlaced(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const sorted = [...rows].sort((a, b) => a.test - b.test)
  const ref = rows.find((r) => r.reference)
  const max = Math.max(1, Math.ceil(Math.max(...rows.flatMap((r) => [r.test, r.test_unseen ?? 0]))))
  const ticks = Array.from({ length: max + 1 }, (_, i) => i)
  const at = (v: number) => `${(v / max) * 100}%`
  const refValue = ref && (split === 'test_unseen' ? (ref.test_unseen ?? ref.test) : ref.test)
  const byId = new Map(models.map((m) => [m.id, m]))
  const below = ref ? sorted.filter((r) => !r.reference && r.test < ref.test).map((r) => r.name) : []
  const only = rows.filter((r) => !r.reference && !byId.has(r.id)).map((r) => r.name)
  const name = (r: Row) => (r.reference ? s.real : r.name)
  const splits: [Split, string][] = [
    ['both', t.both],
    ['test', 'test'],
    ['test_unseen', 'test_unseen'],
  ]
  const th = 'whitespace-nowrap px-4 py-3 text-left font-mono text-[0.7rem] font-medium uppercase tracking-widest text-text-3'

  return (
    <section aria-labelledby="bench-title">
      <h2 id="bench-title" className="sr-only">
        {t.title}
      </h2>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <div role="group" aria-label={t.split} className="inline-flex rounded-field border border-border-strong bg-surface p-0.5">
          {splits.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={split === id}
              onClick={() => setSplit(id)}
              className={cn(
                'min-h-11 rounded-field px-4 font-mono text-sm transition-colors',
                split === id ? 'bg-text text-bg' : 'text-text-2 hover:text-text',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-xs text-text-3">
          <li className="flex items-center gap-1.5">
            <i className="size-2.5 rounded-full bg-accent" />
            {t.keyTest}
          </li>
          <li className="flex items-center gap-1.5">
            <i className="size-2.5 rounded-full border-2 border-accent" />
            {t.keyUnseen}
          </li>
          <li className="flex items-center gap-1.5">
            <i className="h-3 border-l border-dashed border-text-2" />
            {t.keyReal}
          </li>
          <li>{t.lower}</li>
        </ul>
      </div>

      <div tabIndex={0} role="region" aria-label={t.region} className="overflow-x-auto rounded-card border border-border bg-surface">
        <table className="w-full min-w-[900px] border-collapse">
          <caption className="sr-only">
            {t.caption} {dataset}
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className={th}>
                {t.model}
              </th>
              <th scope="col" className={cn(th, 'w-[38%] min-w-80')}>
                {t.axis}
              </th>
              <th scope="col" className={cn(th, 'text-right')}>
                test
              </th>
              <th scope="col" className={cn(th, 'text-right')}>
                test_unseen
              </th>
              <th scope="col" className={th}>
                {t.runs}
              </th>
              <th scope="col" className={th}>
                {t.space}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, row) => {
              const m = byId.get(r.id)
              const grey = !r.reference && !m
              const dot = r.reference ? 'bg-text' : grey ? 'bg-border-strong' : 'bg-accent'
              const ring = r.reference ? 'border-text' : grey ? 'border-border-strong' : 'border-accent'
              const marks: [number, string, boolean][] = [[r.test, dot, split === 'test_unseen']]
              if (r.test_unseen !== undefined) marks.unshift([r.test_unseen, cn('border-2 bg-surface', ring), split === 'test'])
              return (
                <tr key={r.id} className={cn('border-b border-border last:border-b-0', r.reference && 'bg-surface-2')}>
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    <span className={cn('block font-semibold', grey && 'text-text-2')}>{name(r)}</span>
                    <span className="block font-mono text-xs text-text-3">{r.reference ? s.realSub : (m?.base ?? r.repo)}</span>
                  </th>
                  <td className="px-4" aria-hidden="true">
                    <div className="relative h-14">
                      <span className="absolute inset-x-0 top-1/2 border-t border-border" />
                      {refValue !== undefined && <span className="absolute inset-y-1 border-l border-dashed border-text-2" style={{ left: at(refValue) }} />}
                      {marks.map(([v, look, hidden], j) => (
                        <span
                          key={look}
                          className="absolute inset-0 transition-transform duration-700 ease-out"
                          style={{ transform: `translateX(${placed ? at(v) : '0%'})`, transitionDelay: `${150 + (row * 2 + j) * 60}ms` }}
                        >
                          <span
                            className={cn(
                              'absolute top-1/2 left-0 -mt-1.5 -ml-1.5 size-3 rounded-full shadow-[0_0_0_3px_var(--surface)] transition duration-300',
                              look,
                              r.reference && 'shadow-[0_0_0_3px_var(--surface-2)]',
                              hidden && 'scale-50 opacity-0',
                            )}
                          />
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={cn('px-4 text-right font-mono font-medium whitespace-nowrap transition-opacity', split === 'test_unseen' && 'opacity-40')}>
                    {fmt(r.test)}
                  </td>
                  <td className={cn('px-4 text-right font-mono font-medium whitespace-nowrap transition-opacity', split === 'test' && 'opacity-40')}>
                    {r.test_unseen !== undefined ? fmt(r.test_unseen) : <span className="text-xs font-normal text-text-3">{t.notReported}</span>}
                  </td>
                  <td className="px-4">{m && <DeviceTag model={m} />}</td>
                  <td className="px-4">
                    {r.reference ? (
                      <Tag>{s.reference}</Tag>
                    ) : !m ? (
                      <Tag>{s.benchOnly}</Tag>
                    ) : m.available ? (
                      <Tag tone="ok">{s.available}</Tag>
                    ) : (
                      <Tag tone="warn">{s.needsGpu}</Tag>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot aria-hidden="true">
            <tr>
              <td />
              <td className="px-4 pt-1 pb-3">
                <div className="relative h-4 font-mono text-[0.7rem] text-text-3">
                  {ticks.map((v, i) => (
                    <span
                      key={v}
                      className={cn('absolute top-0 whitespace-nowrap', i === 0 ? '' : i === max ? '-translate-x-full' : '-translate-x-1/2')}
                      style={{ left: at(v) }}
                    >
                      {fmt(v, 0)}
                    </span>
                  ))}
                </div>
              </td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-3 grid max-w-4xl gap-1 text-sm text-text-2">
        {below.length > 0 && <p>{fill(below.length > 1 ? t.belowMany : t.below, below, t.and)}</p>}
        {only.length > 0 && <p>{fill(t.only, only, t.and)}</p>}
      </div>
    </section>
  )
}
