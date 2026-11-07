import { useRef, useState } from 'react'
import { NotebookText, ShieldCheck, Shuffle } from 'lucide-react'
import { speak, type Model } from '@/lib/api'
import { useCatalog, useModels } from '@/lib/catalog'
import { strings, usePrefs, useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'
import { Datasets } from '@/components/Datasets'
import { Composer, useSuggestions } from '@/components/Composer'
import { useDock } from '@/components/Dock'
import { GpuNotice } from '@/components/GpuNotice'
import { JobStatus, ringState, useJob } from '@/components/JobStatus'
import { DeviceTag, ModelPicker } from '@/components/ModelPicker'
import { Feedback, PairFeedback } from '@/components/Feedback'
import { Player } from '@/components/Player'
import { Recorder, type AudioClip } from '@/components/Recorder'
import { Ring } from '@/components/Ring'
import { useTerms } from '@/components/Terms'
import { OWN, VoicePicker, useVoiceLabel } from '@/components/VoicePicker'

const S = strings(
  {
    title: 'Text to speech',
    lede: 'Experimental models fine-tuned on 54.6 hours of read Mooré from',
    rate: 'Output is 24 kHz.',
    settings: 'Settings',
    speed: 'Speed',
    own: 'Your reference clip',
    ownHint: 'A few seconds of one speaker, without music or noise.',
    refText: 'Reference transcript, optional',
    refTextHint: 'What the speaker says in the clip',
    consent: "Only clone a voice with the speaker's consent.",
    keepRef: 'Keep my clip to help improve the models (optional). Without this, it is used for this run only.',
    another: 'Another take',
    anotherHint: 'Same text and voice with a new random seed, then tell us which take is better.',
    idle: 'Press Ctrl + Enter to generate. The first run after a restart loads the model.',
    running: 'Generating speech',
    doneA: 'Done in',
    doneB: 'of audio.',
    empty: 'Type a sentence in Mooré first.',
    needClip: 'Upload or record a reference clip first.',
    log: 'Run log',
    logNote: 'Shown on this page only; reloading clears it. Runs are also saved privately for research, see the terms.',
    runs: 'runs',
    run: 'run',
    noRuns: 'No runs yet. Each clip you generate lands here with its model, voice and timing.',
    audio: 'audio',
    made: 'made in',
    loadFailed: 'The model list could not be loaded. Reload the page to try again.',
  },
  {
    title: 'Synthèse vocale',
    lede: 'Des modèles expérimentaux affinés sur 54,6 heures de mooré lu, issues de',
    rate: 'Sortie en 24 kHz.',
    settings: 'Réglages',
    speed: 'Vitesse',
    own: 'Votre extrait de référence',
    ownHint: "Quelques secondes d'une seule personne, sans musique ni bruit.",
    refText: 'Transcription de la référence, facultative',
    refTextHint: "Ce que dit la personne dans l'extrait",
    consent: "Ne clonez une voix qu'avec le consentement de la personne.",
    keepRef: "Conserver mon extrait pour aider à améliorer les modèles (facultatif). Sinon, il ne sert qu'à cette génération.",
    another: 'Une autre prise',
    anotherHint: 'Même texte et même voix avec une nouvelle graine aléatoire, puis dites-nous quelle prise est meilleure.',
    idle: 'Ctrl + Entrée pour générer. La première exécution après un redémarrage charge le modèle.',
    running: 'Génération en cours',
    doneA: 'Terminé en',
    doneB: "d'audio.",
    empty: "Tapez d'abord une phrase en mooré.",
    needClip: "Importez ou enregistrez d'abord un extrait de référence.",
    log: 'Historique',
    logNote: 'Affiché sur cette page uniquement ; recharger l’efface. Les générations sont aussi enregistrées en privé pour la recherche, voir les conditions.',
    runs: 'générations',
    run: 'génération',
    noRuns: 'Aucune génération pour le moment. Chaque extrait apparaît ici avec son modèle, sa voix et sa durée.',
    audio: "d'audio",
    made: 'généré en',
    loadFailed: "La liste des modèles n'a pas pu être chargée. Rechargez la page pour réessayer.",
  },
)

const SPEED_MODELS = ['kokoro']
const TRANSCRIPT_MODELS = ['omnivoice']

type Request = Parameters<typeof speak>[0]
type Take = { run: string; n: number }
type Run = { n: number; run: string; modelId: string; sampling: boolean; req: Request; pairOf?: Take; time: string; text: string; url: string; model: string; voice: string; speed?: number; seconds: number; elapsed: number }

const sec = (s: number) => `${s.toFixed(1)} s`

export default function Tts() {
  const t = useT(S)
  const models = useModels('tts')
  const { error } = useCatalog()
  const [picked, setPicked] = useState<string>()
  const model = models.find((m) => m.id === picked) ?? models.find((m) => m.default) ?? models[0]

  if (!model)
    return (
      <div className="grid min-h-[50vh] place-items-center px-4 text-center text-text-2">
        {error ? <p>{t.loadFailed}</p> : <Ring id="faso-speech-lab" state="spin" className="size-14" />}
      </div>
    )

  return <Workbench models={models} model={model} onModel={setPicked} />
}

function Workbench({ models, model, onModel }: { models: Model[]; model: Model; onModel: (id: string) => void }) {
  const t = useT(S)
  const label = useVoiceLabel()
  const ensureTerms = useTerms()
  const dock = useDock()
  const job = useJob()
  const ring = useRef<HTMLSpanElement>(null)
  const [text, setText] = useState('')
  const [voices, setVoices] = useState<Record<string, string>>({})
  const [speed, setSpeed] = useState(1)
  const [reference, setReference] = useState<AudioClip | null>(null)
  const [referenceText, setReferenceText] = useState('')
  const [keepRef, setKeepRef] = useState(false)
  const { lang } = usePrefs()
  const examples = useSuggestions().map((s) => s.text as string)
  const [runs, setRuns] = useState<Run[]>([])

  const voice = voices[model.id] ?? model.voices[0]
  const voiceName = label(model, voice).full
  const hasSpeed = SPEED_MODELS.includes(model.id)
  const last = runs[0]

  const generate = async () => {
    if (!text.trim()) return job.fail(t.empty)
    if (voice === OWN && !reference) return job.fail(t.needClip)
    if (!(await ensureTerms())) return
    await synth({
      text,
      model: model.id,
      voice,
      speed: hasSpeed ? speed : 1,
      reference: voice === OWN ? reference?.wav : null,
      referenceText: TRANSCRIPT_MODELS.includes(model.id) ? referenceText : '',
      keepReference: voice === OWN && keepRef,
      source: examples.includes(text.trim()) ? 'example' : 'typed',
      lang,
      seed: 0,
    })
  }

  /** One run; `pairOf` marks a second take of an earlier run, to ask which take is better. */
  const synth = async (req: Request, pairOf?: Take) => {
    const out = await job.run(() => speak(req))
    if (!out) return
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
    setRuns((r) => [
      { n: r.length + 1, run: out.run, modelId: model.id, sampling: model.sampling, req, pairOf, time, text: req.text, url: out.audio.url, model: model.name, voice: voiceName, speed: hasSpeed ? req.speed : undefined, seconds: out.seconds, elapsed: out.elapsed },
      ...r,
    ])
    dock.show({ url: out.audio.url, text: req.text, model: model.name, voice: req.voice, voiceLabel: voiceName }, ring.current?.firstElementChild as HTMLElement | null)
  }

  const retake = (r: Run) => synth({ ...r.req, seed: (r.req.seed ?? 0) + 1 + Math.floor(Math.random() * 1000) }, { run: r.run, n: r.n })

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t.title}</h1>
          <p className="mt-1.5 max-w-xl text-text-2">
            {t.lede}{' '}
            <Datasets />
            . {t.rate}
          </p>
        </div>
        <p className="flex items-center gap-2 text-sm text-text-3">
          <span className="font-semibold text-text-2">{model.name}</span>
          <DeviceTag model={model} />
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:grid-rows-[auto_1fr] lg:gap-x-6">
        <Composer
          className="lg:col-start-1 lg:row-start-1"
          text={text}
          onText={setText}
          onGenerate={generate}
          voiceId={voice}
          voiceLabel={voiceName}
          modelName={model.name}
          ring={ringState(job.phase)}
          disabled={!model.available || job.busy}
          ringRef={ring}
          status={
            <JobStatus
              phase={job.phase}
              error={job.error}
              idle={t.idle}
              running={t.running}
              done={last && `${t.doneA} ${sec(last.elapsed)}, ${sec(last.seconds)} ${t.doneB}`}
            />
          }
        />

        <aside aria-label={t.settings} className="divide-y divide-border rounded-card border border-border bg-surface lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <ModelPicker className="p-4" models={models} value={model.id} onChange={onModel} />
          {model.available ? (
            <>
              <VoicePicker className="p-4" model={model} value={voice} onChange={(v) => setVoices({ ...voices, [model.id]: v })} />
              {model.cloning && (
                <div className="grid gap-3 p-4">
                  {voice === OWN && (
                    <>
                      <div>
                        <p className="text-sm font-semibold">{t.own}</p>
                        <p className="text-xs text-text-3">{t.ownHint}</p>
                      </div>
                      <Recorder sampleRate={24000} maxSeconds={15} onChange={setReference} />
                      <label className="flex items-start gap-2 text-sm text-text-2">
                        <input type="checkbox" checked={keepRef} onChange={(e) => setKeepRef(e.target.checked)} className="mt-0.5 size-4 accent-[var(--accent)]" />
                        {t.keepRef}
                      </label>
                    </>
                  )}
                  {TRANSCRIPT_MODELS.includes(model.id) && (
                    <label className="grid gap-1.5 text-sm font-semibold">
                      {t.refText}
                      <input
                        lang="mos"
                        value={referenceText}
                        onChange={(e) => setReferenceText(e.target.value)}
                        placeholder={t.refTextHint}
                        className="moore h-11 rounded-field border border-border bg-surface-2 px-3 font-normal placeholder:text-text-3"
                      />
                    </label>
                  )}
                  <p className="flex items-start gap-2 rounded-field bg-accent-soft px-3 py-2.5 text-sm font-semibold">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                    {t.consent}
                  </p>
                </div>
              )}
              {hasSpeed && <Speed value={speed} onChange={setSpeed} />}
            </>
          ) : (
            <div className="p-4">
              <GpuNotice model={model} />
            </div>
          )}
        </aside>

        <RunLog runs={runs} busy={job.busy} onRetake={retake} className="lg:col-start-1 lg:row-start-2" />
      </div>
    </div>
  )
}

function Speed({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const t = useT(S)
  return (
    <div className="grid gap-2 p-4">
      <div className="flex items-baseline justify-between">
        <label htmlFor="speed" className="text-xs font-bold uppercase tracking-wider text-text-3">
          {t.speed}
        </label>
        <output htmlFor="speed" className="font-mono text-sm tabular-nums">
          {value.toFixed(2)}x
        </output>
      </div>
      <div className="flex items-center gap-3 font-mono text-xs text-text-3">
        <span>0.7x</span>
        <input id="speed" type="range" min={0.7} max={1.3} step={0.05} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-11 flex-1 accent-[var(--accent)]" />
        <span>1.3x</span>
      </div>
    </div>
  )
}

function RunLog({ runs, busy, onRetake, className }: { runs: Run[]; busy: boolean; onRetake: (r: Run) => void; className?: string }) {
  const t = useT(S)
  return (
    <section aria-labelledby="run-log" className={cn('rounded-card border border-border bg-surface', className)}>
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div>
          <h2 id="run-log" className="font-bold">
            {t.log}
          </h2>
          <p className="text-sm text-text-3">{t.logNote}</p>
        </div>
        {runs.length > 0 && (
          <span className="shrink-0 font-mono text-xs text-text-3">
            {runs.length} {runs.length === 1 ? t.run : t.runs}
          </span>
        )}
      </div>
      {runs.length === 0 ? (
        <p className="grid justify-items-center gap-2 px-4 py-8 text-center text-sm text-text-3">
          <NotebookText className="size-6" aria-hidden="true" />
          {t.noRuns}
        </p>
      ) : (
        <ol>
          {runs.map((r, i) => (
            <li key={r.n} className={cn('grid gap-2 border-b border-border p-4 last:border-b-0 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-x-4', i === 0 && 'shadow-[inset_2px_0_0_var(--accent)]')}>
              <div className="flex gap-2.5 font-mono text-xs text-text-3 sm:block">
                <span className="font-semibold text-text-2">#{String(r.n).padStart(2, '0')}</span>
                <span className="sm:block">{r.time}</span>
              </div>
              <div className="grid min-w-0 gap-2">
                <p lang="mos" className="moore line-clamp-2">
                  {r.text}
                </p>
                <Player url={r.url} />
                {r.pairOf ? (
                  <PairFeedback key={r.run} a={r.pairOf} b={{ run: r.run, n: r.n }} model={r.modelId} />
                ) : (
                  <Feedback key={r.run} run={r.run} task="tts" model={r.modelId} />
                )}
                {r.sampling && !r.pairOf && (
                  <button type="button" disabled={busy} onClick={() => onRetake(r)} title={t.anotherHint} className="inline-flex h-9 items-center gap-1.5 justify-self-start rounded-field border border-border-strong px-3 text-sm font-semibold text-text-2 hover:bg-surface-2 disabled:opacity-50">
                    <Shuffle className="size-4" aria-hidden="true" />
                    {t.another}
                  </button>
                )}
                <p className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs text-text-3">
                  <span>{r.model}</span>
                  <span>
                    {r.voice}
                    {r.speed != null && ` · ${r.speed.toFixed(2)}x`}
                  </span>
                  <span>
                    {sec(r.seconds)} {t.audio}
                  </span>
                  <span>
                    {t.made} {sec(r.elapsed)}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
