import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Map as MapIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Model } from '@/lib/api'
import { useModels } from '@/lib/catalog'
import { strings, usePrefs, useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'
import { cer, DeviceTag, pct } from '@/components/ModelPicker'
import { Ring } from '@/components/Ring'
import { LIVE, PLANNED } from '@/tasks'

const S = strings(
  {
    title: 'Two live tasks, and a call for listeners',
    tts: 'Type Mooré, pick a model and a voice, then listen. Kokoro reads in 13 voices from the training data.',
    asr: 'Upload or record Mooré speech and get the transcript, with a confidence for each word.',
    compare: 'Do you speak Mooré? Listen to the same sentence from two or three models, names hidden, and rate how natural each sounds. Your name stays private, results are published only as averages, and you can stop whenever you like. Your ratings feed our research paper.',
    defaultModel: 'Default model',
    model: 'Model',
    openTts: 'Open text to speech',
    openAsr: 'Open speech to text',
    openCompare: 'Start rating',
    roadmap: 'Roadmap',
    roadmapNote: 'Not available yet',
    planned: 'planned',
    mt: 'Text in one language, text in the other.',
    st: 'Mooré speech in, French text out.',
    s2st: 'Mooré speech in, French speech out, or the reverse.',
    assistant: 'Spoken questions and answers in Mooré.',
    test: 'test CER',
    dev: 'dev CER',
  },
  {
    title: 'Deux tâches en ligne, et un appel aux auditeurs',
    tts: "Tapez du mooré, choisissez un modèle et une voix, puis écoutez. Kokoro lit avec 13 voix issues des données d'entraînement.",
    asr: 'Importez ou enregistrez de la parole en mooré et obtenez la transcription, avec une confiance pour chaque mot.',
    compare: "Vous parlez mooré ? Écoutez la même phrase lue par deux ou trois modèles, sans leur nom, et notez le naturel de chacune. Votre nom reste privé, les résultats ne sont publiés que sous forme de moyennes, et vous pouvez arrêter quand vous voulez. Vos notes nourrissent notre article de recherche.",
    defaultModel: 'Modèle par défaut',
    model: 'Modèle',
    openTts: 'Ouvrir la synthèse vocale',
    openAsr: 'Ouvrir la transcription',
    openCompare: "Commencer l'évaluation",
    roadmap: 'Feuille de route',
    roadmapNote: 'Pas encore disponible',
    planned: 'prévu',
    mt: "Du texte dans une langue, du texte dans l'autre.",
    st: 'Parole en mooré en entrée, texte en français en sortie.',
    s2st: "Parole en mooré en entrée, parole en français en sortie, ou l'inverse.",
    assistant: 'Questions et réponses parlées en mooré.',
    test: 'CER test',
    dev: 'CER dev',
  },
)

const [TTS, ASR, COMPARE] = LIVE

export function Tiles() {
  const t = useT(S)
  const { lang } = usePrefs()
  const tts = useModels('tts')
  const asr = useModels('asr')
  const kokoro = tts.find((m) => m.default)
  const judge = asr.find((m) => m.default) ?? asr[0]
  const ranked = [...tts].sort((a, b) => Number(b.default) - Number(a.default) || Number(b.available) - Number(a.available) || (cer(a).value ?? 9) - (cer(b).value ?? 9)).slice(0, 3)

  return (
    <section aria-labelledby="tasks-title" className="mx-auto max-w-6xl px-4 pt-16 md:pt-20">
      <h2 id="tasks-title" className="text-2xl font-extrabold tracking-tight md:text-3xl">
        {t.title}
      </h2>
      <div className="mt-6 grid gap-4 md:grid-cols-12">
        <Tile className="md:col-span-7" icon={TTS.icon} title={TTS.label[lang]} to={TTS.path} cta={t.openTts}>
          <p className="text-text-2">{t.tts}</p>
          {kokoro && <Spec label={t.defaultModel} model={kokoro} />}
        </Tile>
        <Tile className="md:col-span-5" icon={ASR.icon} title={ASR.label[lang]} to={ASR.path} cta={t.openAsr}>
          <p className="text-text-2">{t.asr}</p>
          {judge && <Spec label={t.model} model={judge} />}
        </Tile>
        <Tile className="md:col-span-5" icon={COMPARE.icon} title={COMPARE.label[lang]} to={COMPARE.path} cta={t.openCompare}>
          <p className="text-text-2">{t.compare}</p>
          {ranked.length > 0 && (
            <ul className="divide-y divide-border border-y border-border">
              {ranked.map((m) => (
                <li key={m.id} className="flex min-h-11 items-center gap-3 text-sm">
                  <Ring id={m.id} bars={28} state="on" className="size-6" />
                  <span className="flex-1 font-semibold">{m.name}</span>
                  <span className="font-mono tabular-nums text-text-2">{pct(cer(m).value)}</span>
                </li>
              ))}
            </ul>
          )}
        </Tile>
        <Roadmap className="md:col-span-7" />
      </div>
    </section>
  )
}

type TileProps = { icon: LucideIcon; title: string; to: string; cta: string; className?: string; children: ReactNode }

function Tile({ icon: Icon, title, to, cta, className, children }: TileProps) {
  return (
    <article className={cn('flex flex-col gap-4 rounded-card border border-border bg-surface p-5 md:p-6', className)}>
      <h3 className="flex items-center gap-2.5 text-lg font-bold">
        <Icon className="size-5 text-accent" aria-hidden="true" />
        {title}
      </h3>
      {children}
      <Link to={to} className="mt-auto inline-flex min-h-11 items-center gap-1.5 self-start font-semibold text-accent hover:underline hover:underline-offset-4">
        {cta}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </article>
  )
}

function Spec({ label, model }: { label: string; model: Model }) {
  const t = useT(S)
  const score = cer(model)
  return (
    <dl className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-4 rounded-field bg-surface-2 px-4 py-3">
      <dt className="col-span-2 text-xs font-bold uppercase tracking-wider text-text-3">{label}</dt>
      <dd className="min-w-0">
        <span className="block font-semibold">{model.name}</span>
        <span className="flex items-center gap-2 text-xs text-text-3">
          <DeviceTag model={model} />
          {model.task === 'tts' && <span className="font-mono">24 kHz</span>}
        </span>
      </dd>
      <dd className="text-right font-mono text-xl font-semibold tabular-nums">
        {pct(score.value)}
        <small className="block text-[11px] font-normal text-text-3">{t[score.split]}</small>
      </dd>
    </dl>
  )
}

function Roadmap({ className }: { className?: string }) {
  const t = useT(S)
  const { lang } = usePrefs()
  const notes: Record<string, string> = { mt: t.mt, st: t.st, s2st: t.s2st, assistant: t.assistant }
  return (
    <article aria-labelledby="roadmap-title" className={cn('rounded-card border border-dashed border-border-strong p-5 md:p-6', className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 id="roadmap-title" className="flex items-center gap-2.5 text-lg font-bold">
          <MapIcon className="size-5 text-text-3" aria-hidden="true" />
          {t.roadmap}
        </h3>
        <span className="rounded-field border border-border px-2.5 py-0.5 text-xs text-text-3">{t.roadmapNote}</span>
      </div>
      <ol className="mt-3">
        {PLANNED.map(({ id, icon: Icon, label }) => (
          <li key={id} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-3 border-b border-border py-3 last:border-b-0">
            <Icon className="mt-0.5 size-4 text-text-3" aria-hidden="true" />
            <div>
              <b className="block font-semibold text-text-2">{label[lang]}</b>
              <span className="text-sm text-text-3">{notes[id]}</span>
            </div>
            <span className="font-mono text-xs text-text-3">{t.planned}</span>
          </li>
        ))}
      </ol>
    </article>
  )
}
