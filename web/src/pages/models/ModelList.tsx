import { useState, type ReactNode } from 'react'
import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { sampleUrl, type Model } from '@/lib/api'
import { LINKS } from '@/lib/links'
import { strings, usePrefs, useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'
import { LIVE } from '@/tasks'
import { Ring } from '@/components/Ring'
import { Player } from '@/components/Player'
import { BrandIcon } from '@/components/BrandIcon'
import { S as Shared, usePct, type Row } from './shared'
import { DeviceTag, Tag } from './Tags'

const S = strings(
  {
    title: 'Model details',
    lede: 'Every speech model here was fine-tuned on {hours} h of read Mooré, mostly religious text, and outputs 24 kHz audio.',
    base: 'Base model',
    task: 'Task',
    hardware: 'Hardware',
    gpuNote: 'Not running on this Space yet. The samples below come from the model card.',
    voices: 'Voices',
    fixed: '{n} reader voices from the training data',
    cloning: 'Clones a voice from a short reference clip',
    licence: 'Licence',
    data: 'Training data',
    hours: '{hours} h of read Mooré',
    output: 'Output',
    input: 'Input',
    weights: 'Weights',
    role: 'Role',
    judge: 'Judge 1 of MooreSpeechBench',
    status: 'Status',
    benchOnly: 'Scored in MooreSpeechBench, not served in this Space.',
    samples: 'Samples from the model card',
    sample: 'Sample {n}',
  },
  {
    title: 'Détails des modèles',
    lede: "Chaque modèle vocal ici a été affiné sur {hours} h de mooré lu, surtout des textes religieux, et produit de l'audio à 24 kHz.",
    base: 'Modèle de base',
    task: 'Tâche',
    hardware: 'Matériel',
    gpuNote: "Pas encore servi sur ce Space. Les extraits ci-dessous viennent de la fiche du modèle.",
    voices: 'Voix',
    fixed: "{n} voix de lecteurs des données d'entraînement",
    cloning: "Clone une voix à partir d'un court extrait de référence",
    licence: 'Licence',
    data: "Données d'entraînement",
    hours: '{hours} h de mooré lu',
    output: 'Sortie',
    input: 'Entrée',
    weights: 'Poids',
    role: 'Rôle',
    judge: 'Juge 1 de MooreSpeechBench',
    status: 'Statut',
    benchOnly: 'Évalué dans MooreSpeechBench, non servi dans ce Space.',
    samples: 'Extraits de la fiche du modèle',
    sample: 'Extrait {n}',
  },
)

const out = { target: '_blank', rel: 'noreferrer' }
const fill = (s: string, k: string, v: string | number) => s.replace(`{${k}}`, String(v))

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={cn('min-w-0 py-2.5 pr-4', wide && 'col-span-2')}>
      <dt className="font-mono text-[0.68rem] font-medium uppercase tracking-widest text-text-3">{label}</dt>
      <dd className="mt-1.5 text-sm [overflow-wrap:anywhere]">{children}</dd>
    </div>
  )
}

function HfLink({ repo }: { repo: string }) {
  const s = useT(Shared)
  return (
    <a href={LINKS.hf(repo)} {...out} className="-my-3 inline-flex items-center gap-2 py-3 font-medium text-accent hover:underline">
      <BrandIcon name="huggingface" className="size-4" />
      {s.hfModel}
      <ArrowUpRight className="size-3.5" aria-hidden="true" />
    </a>
  )
}

type ItemProps = {
  id: string
  open: boolean
  onToggle: (id: string, open: boolean) => void
  title: string
  sub: string
  score: string
  tag: ReactNode
  muted?: boolean
  children: ReactNode
}

function Item({ id, open, onToggle, title, sub, score, tag, muted, children }: ItemProps) {
  return (
    <details open={open} onToggle={(e) => onToggle(id, e.currentTarget.open)} className="group border-b border-border">
      <summary className="grid min-h-16 cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto_20px] items-center gap-3 py-2 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_20px] sm:gap-4 [&::-webkit-details-marker]:hidden">
        <Ring id={id} state={open ? 'on' : 'idle'} className="size-9" />
        <span className="min-w-0">
          <b className={cn('block truncate font-semibold group-hover:text-accent', muted && 'text-text-2')}>{title}</b>
          <span className="block truncate font-mono text-xs text-text-3">{sub}</span>
        </span>
        <span className="hidden font-mono text-sm sm:inline">{score}</span>
        {tag}
        <ChevronDown className="size-5 text-text-3 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pb-5 pl-0 sm:pl-[3.25rem]">{children}</div>
    </details>
  )
}

export function ModelList({ models, rows, hours }: { models: Model[]; rows: Row[]; hours: number }) {
  const t = useT(S)
  const s = useT(Shared)
  const { lang } = usePrefs()
  const fmt = usePct()
  const def = models.find((m) => m.default && m.task === 'tts') ?? models[0]
  const [open, setOpen] = useState<Record<string, boolean>>(() => (def ? { [def.id]: true } : {}))
  const toggle = (id: string, v: boolean) => setOpen((o) => (o[id] === v ? o : { ...o, [id]: v }))
  const h = hours.toLocaleString(lang)
  const taskName = (id: string) => LIVE.find((x) => x.id === id)?.label[lang] ?? id
  const ids = new Set(models.map((m) => m.id))
  const benchOnly = rows.filter((r) => !r.reference && !ids.has(r.id) && r.repo)
  const rank = (m: Model) => [m === def ? 0 : 1, m.task === 'tts' ? 0 : 1, m.scores.test ?? 0]
  const ordered = [...models].sort((a, b) => {
    const [x, y] = [rank(a), rank(b)]
    return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]
  })

  return (
    <section aria-labelledby="details-title" className="mt-16">
      <h2 id="details-title" className="text-xl font-bold">
        {t.title}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-text-2">{fill(t.lede, 'hours', h)}</p>
      <div className="mt-5 border-t border-text">
        {ordered.map((m) => {
          const tts = m.task === 'tts'
          const scores = Object.entries(m.scores)
          return (
            <Item
              key={m.id}
              id={m.id}
              open={!!open[m.id]}
              onToggle={toggle}
              title={tts ? m.name : m.repo.split('/').pop()!}
              sub={m.base}
              score={scores.map(([k, v]) => `${k} ${fmt(v)}`).join('  ')}
              tag={<DeviceTag model={m} />}
            >
              <dl className="grid grid-cols-2 lg:grid-cols-4">
                <Field label={t.base}>
                  <span className="font-mono">{m.base}</span>
                </Field>
                <Field label={t.task}>{taskName(m.task)}</Field>
                {scores.map(([k, v]) => (
                  <Field key={k} label={`CER ${k}`}>
                    <span className="font-mono">{fmt(v)}</span>
                  </Field>
                ))}
                <Field label={t.hardware}>
                  <DeviceTag model={m} long />
                </Field>
                {tts ? (
                  <Field label={t.voices}>{m.cloning ? t.cloning : fill(t.fixed, 'n', m.voices.length)}</Field>
                ) : (
                  <Field label={t.role}>{t.judge}</Field>
                )}
                <Field label={t.licence}>
                  <a href={LINKS.licence} {...out} className="-my-3 inline-flex py-3 text-accent hover:underline">
                    {m.licence}
                  </a>
                </Field>
                {tts && <Field label={t.data}>{fill(t.hours, 'hours', h)}</Field>}
                <Field label={tts ? t.output : t.input}>
                  <span className="font-mono">{tts ? '24 kHz' : '16 kHz'}</span>
                </Field>
                <Field label={t.weights} wide>
                  <HfLink repo={m.repo} />
                </Field>
              </dl>
              {!m.available && m.samples.length > 0 && (
                <div className="mt-3 rounded-card border border-border bg-surface p-4">
                  <p className="text-sm text-text-2">{t.gpuNote}</p>
                  <h3 className="mt-3 font-mono text-[0.68rem] font-medium uppercase tracking-widest text-text-3">{t.samples}</h3>
                  {open[m.id] && (
                    <ul className="mt-2 grid gap-x-6 gap-y-3 md:grid-cols-2">
                      {m.samples.map((_, n) => (
                        <li key={n}>
                          <span className="font-mono text-xs text-text-3">{fill(t.sample, 'n', n + 1)}</span>
                          <Player url={sampleUrl(m.id, n)} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </Item>
          )
        })}
        {benchOnly.map((r) => (
          <Item
            key={r.id}
            id={r.id}
            open={!!open[r.id]}
            onToggle={toggle}
            title={r.name}
            sub={r.repo!}
            score={`test ${fmt(r.test)}`}
            tag={<Tag>{s.benchOnly}</Tag>}
            muted
          >
            <dl className="grid grid-cols-2 lg:grid-cols-4">
              <Field label={t.status} wide>
                {t.benchOnly}
              </Field>
              <Field label="CER test">
                <span className="font-mono">{fmt(r.test)}</span>
              </Field>
              {r.test_unseen !== undefined && (
                <Field label="CER test_unseen">
                  <span className="font-mono">{fmt(r.test_unseen)}</span>
                </Field>
              )}
              <Field label={t.weights} wide>
                <HfLink repo={r.repo!} />
              </Field>
            </dl>
          </Item>
        ))}
      </div>
    </section>
  )
}
