import { useState, type ReactNode } from 'react'
import { Check, Copy, Download, TextCursorInput } from 'lucide-react'
import { transcribe, type Transcript } from '@/lib/api'
import { useModels } from '@/lib/catalog'
import { strings, usePrefs, useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'
import { Feedback } from '@/components/Feedback'
import { JobStatus, useJob } from '@/components/JobStatus'
import { ModelPicker } from '@/components/ModelPicker'
import { Recorder, type AudioClip } from '@/components/Recorder'

const S = strings(
  {
    title: 'Speech to text',
    lede: 'Transcribe Mooré speech. Each word is shaded by how confident the model was.',
    limits: 'up to 60 s per clip, resampled to 16 kHz',
    input: 'Audio input',
    transcribe: 'Transcribe',
    running: 'Transcribing your clip',
    done: 'Done in {s}.',
    needClip: 'Upload or record a clip first.',
    keep: 'Keep my recording to help improve the models (optional). Without this, only the transcript is saved.',
    transcript: 'Transcript',
    copy: 'Copy transcript',
    copied: 'Copied',
    download: 'Download transcript as text',
    empty: 'No transcript yet. Upload or record a clip, then press Transcribe.',
    show: 'Show confidence',
    legend: 'Confidence legend',
    high: 'high, 0.90 or more',
    mid: 'medium',
    low: 'low, under 0.70',
    audio: 'Audio',
    processing: 'Processing',
    words: 'Words',
    nothing: 'No speech was recognised in this clip.',
  },
  {
    title: 'Transcription',
    lede: 'Transcrivez de la parole en mooré. Chaque mot est nuancé selon la confiance du modèle.',
    limits: "jusqu'à 60 s par extrait, rééchantillonné à 16 kHz",
    input: 'Entrée audio',
    transcribe: 'Transcrire',
    running: 'Transcription de votre extrait en cours',
    done: 'Terminé en {s}.',
    needClip: "Importez ou enregistrez d'abord un extrait.",
    keep: "Conserver mon enregistrement pour aider à améliorer les modèles (facultatif). Sinon, seule la transcription est enregistrée.",
    transcript: 'Transcription',
    copy: 'Copier la transcription',
    copied: 'Copié',
    download: 'Télécharger la transcription en texte',
    empty: "Pas encore de transcription. Importez ou enregistrez un extrait, puis appuyez sur Transcrire.",
    show: 'Afficher la confiance',
    legend: 'Légende de la confiance',
    high: 'élevée, 0,90 ou plus',
    mid: 'moyenne',
    low: 'faible, moins de 0,70',
    audio: 'Audio',
    processing: 'Traitement',
    words: 'Mots',
    nothing: "Aucune parole n'a été reconnue dans cet extrait.",
  },
)

const SR = 16000
const MAX_SECONDS = 60

const level = (c: number) => (c >= 0.9 ? 'high' : c >= 0.7 ? 'mid' : 'low')
const SHADE = { high: '', mid: 'bg-accent/15', low: 'bg-accent/30 underline decoration-accent decoration-dotted decoration-[1.5px] underline-offset-[5px]' }

export default function Asr() {
  const t = useT(S)
  const models = useModels('asr')
  const [picked, setPicked] = useState<string>()
  const model = models.find((m) => m.id === picked) ?? models.find((m) => m.default) ?? models[0]
  const [clip, setClip] = useState<AudioClip | null>(null)
  const [result, setResult] = useState<Transcript>()
  const job = useJob()
  const [keep, setKeep] = useState(false)
  const { lang } = usePrefs()

  const run = async () => {
    if (!clip) return job.fail(t.needClip)
    setResult(undefined)
    const out = await job.run(() => transcribe(clip.wav, model?.id, keep, lang))
    if (out) setResult(out)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t.title}</h1>
          <p className="mt-1.5 max-w-xl text-text-2">{t.lede}</p>
        </div>
        <p className="font-mono text-xs text-text-3">{t.limits}</p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-6">
        <section aria-label={t.input} className="divide-y divide-border rounded-card border border-border bg-surface">
          <Recorder
            className="p-4"
            sampleRate={SR}
            maxSeconds={MAX_SECONDS}
            onChange={(c) => {
              setClip(c)
              setResult(undefined)
            }}
          />
          <div className="grid gap-4 p-4">
            {model && <ModelPicker models={models} value={model.id} onChange={setPicked} />}
            <button
              type="button"
              onClick={run}
              disabled={job.busy || !model}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-field bg-accent px-6 font-bold text-accent-fg transition hover:bg-accent-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <TextCursorInput className="size-5" aria-hidden="true" />
              {t.transcribe}
            </button>
            <label className="flex items-start gap-2 text-sm text-text-2">
              <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} className="mt-0.5 size-4 accent-[var(--accent)]" />
              {t.keep}
            </label>
          </div>
        </section>
        <TranscriptPanel
          result={result}
          model={model?.id ?? ''}
          busy={job.busy}
          status={<JobStatus phase={job.phase} error={job.error} running={t.running} done={result && t.done.replace('{s}', `${result.elapsed.toFixed(1)} s`)} />}
        />
      </div>
    </div>
  )
}

function TranscriptPanel({ result, model, busy, status }: { result?: Transcript; model: string; busy: boolean; status: ReactNode }) {
  const t = useT(S)
  const [shade, setShade] = useState(true)
  const [copied, setCopied] = useState(false)
  const text = result?.text.trim() ?? ''

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([text + '\n'], { type: 'text/plain;charset=utf-8' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'transcript-moore.txt' })
    a.click()
    URL.revokeObjectURL(url)
  }

  const icon = 'grid size-11 place-items-center rounded-field text-text-2 hover:bg-surface-2 hover:text-text disabled:opacity-40'
  return (
    <section aria-labelledby="transcript" className="rounded-card border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border py-2 pl-4 pr-2">
        <h2 id="transcript" className="font-bold">
          {t.transcript}
        </h2>
        <div className="flex">
          <button type="button" onClick={copy} disabled={!text} aria-label={copied ? t.copied : t.copy} title={t.copy} className={icon}>
            {copied ? <Check className="size-4 text-accent" /> : <Copy className="size-4" />}
          </button>
          <button type="button" onClick={download} disabled={!text} aria-label={t.download} title={t.download} className={icon}>
            <Download className="size-4" />
          </button>
        </div>
      </div>
      <div role="status" className="px-4 pt-4 text-sm empty:hidden">
        {status}
      </div>
      <div className="min-h-40 px-4 pb-2 pt-5">
        {!result ? (
          !busy && <p className="text-sm text-text-3">{t.empty}</p>
        ) : result.words.length === 0 ? (
          <p className="text-sm text-text-3">{t.nothing}</p>
        ) : (
          <p lang="mos" className="moore text-xl leading-[2.1]">
            {result.words.map((w, i) => (
              <span key={i}>
                <span title={w.confidence.toFixed(2)} className={cn('rounded-[3px] px-[3px] py-0.5', shade && SHADE[level(w.confidence)])}>
                  {w.word}
                </span>{' '}
              </span>
            ))}
          </p>
        )}
      </div>
      {result && result.words.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 pb-2">
          <ul aria-label={t.legend} className={cn('flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-xs text-text-3', !shade && 'invisible')}>
            {(['high', 'mid', 'low'] as const).map((k) => (
              <li key={k} className="flex items-center gap-1.5">
                <i className={cn('inline-block h-3 w-[18px] rounded-[2px] border border-border', SHADE[k].split(' ')[0])} aria-hidden="true" />
                {t[k]}
              </li>
            ))}
          </ul>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-text-2">
            <input type="checkbox" checked={shade} onChange={(e) => setShade(e.target.checked)} className="size-4 accent-[var(--accent)]" />
            {t.show}
          </label>
        </div>
      )}
      {result && result.words.length > 0 && (
        <Feedback key={result.run} run={result.run} task="asr" model={model} transcript={result.text.trim()} className="border-t border-border p-4" />
      )}
      <dl className="grid grid-cols-3 divide-x divide-border border-t border-border">
        {[
          [t.audio, result && `${result.seconds.toFixed(1)} s`],
          [t.processing, result && `${result.elapsed.toFixed(1)} s`],
          [t.words, result?.words.length],
        ].map(([k, v]) => (
          <div key={k} className="px-4 py-3">
            <dt className="font-mono text-[11px] uppercase tracking-widest text-text-3">{k}</dt>
            <dd className="mt-1.5 font-mono text-lg tabular-nums">{v ?? '-'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
