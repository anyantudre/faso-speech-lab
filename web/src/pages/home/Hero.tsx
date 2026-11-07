import { useRef, useState } from 'react'
import { speak } from '@/lib/api'
import { useCatalog, useModels } from '@/lib/catalog'
import { strings, useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'
import { Datasets } from '@/components/Datasets'
import { Composer } from '@/components/Composer'
import { useDock } from '@/components/Dock'
import { JobStatus, ringState, useJob } from '@/components/JobStatus'
import { Ring } from '@/components/Ring'
import { useTerms } from '@/components/Terms'
import { useVoiceLabel } from '@/components/VoicePicker'

const S = strings(
  {
    title: 'Open speech research',
    titleEm: 'for Mooré.',
    lede: 'Experimental models from an independent research project, trained on',
    ledeEnd: 'Try them, then tell us how they sound.',
    voice: 'Voice',
    idle: 'The first run after a restart can take up to a minute.',
    running: 'Generating speech',
    done: 'Done. {s} of audio, now playing in the player below.',
    empty: 'Type a sentence in Mooré first.',
    offline: 'The model list could not be loaded. Reload the page to try again.',
  },
  {
    title: 'Recherche ouverte sur la parole',
    titleEm: 'en mooré.',
    lede: "Des modèles expérimentaux issus d'un projet de recherche indépendant, entraînés sur",
    ledeEnd: 'Essayez-les, puis dites-nous ce que vous en pensez.',
    voice: 'Voix',
    idle: "La première exécution après un redémarrage peut prendre jusqu'à une minute.",
    running: 'Génération en cours',
    done: "Terminé. {s} d'audio, en lecture dans le lecteur en bas.",
    empty: "Tapez d'abord une phrase en mooré.",
    offline: "La liste des modèles n'a pas pu être chargée. Rechargez la page pour réessayer.",
  },
)

export function Hero() {
  const t = useT(S)
  const { error } = useCatalog()
  const model = useModels('tts').find((m) => m.default)
  const label = useVoiceLabel()
  const ensureTerms = useTerms()
  const dock = useDock()
  const job = useJob()
  const ring = useRef<HTMLSpanElement>(null)
  const [text, setText] = useState('')
  const [picked, setPicked] = useState<string>()
  const [seconds, setSeconds] = useState(0)

  const voices = model?.voices ?? []
  const voice = picked ?? voices[0] ?? 'faso-speech-lab'
  const voiceName = model ? label(model, voice).full : ''

  const generate = async () => {
    if (!model) return
    if (!text.trim()) return job.fail(t.empty)
    if (!(await ensureTerms())) return
    const out = await job.run(() => speak({ text, model: model.id, voice, speed: 1 }))
    if (!out) return
    setSeconds(out.seconds)
    dock.show({ url: out.audio.url, text, model: model.name, voice, voiceLabel: voiceName }, ring.current?.firstElementChild as HTMLElement | null)
  }

  return (
    <section aria-labelledby="hero-title" className="pt-10 md:pt-16">
      <div className="mx-auto max-w-5xl px-4">
        <h1 id="hero-title" className="text-center text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          {t.title} <em className="not-italic text-accent">{t.titleEm}</em>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-lg text-text-2">
          {t.lede}{' '}
          <Datasets />
          . {t.ledeEnd}
        </p>
        <Composer
          className="mt-8 md:mt-10"
          text={text}
          onText={setText}
          onGenerate={generate}
          voiceId={voice}
          voiceLabel={voiceName}
          modelName={model?.name ?? ''}
          ring={ringState(job.phase)}
          disabled={!model?.available || job.busy}
          ringRef={ring}
          bar={
            voices.length > 0 && (
              <div role="group" aria-label={t.voice} className="-mx-1 flex w-full min-w-0 overflow-x-auto lg:w-auto lg:flex-1">
                {voices.map((v) => {
                  const on = v === voice
                  const name = label(model!, v).full
                  return (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={on}
                      aria-label={name}
                      title={name}
                      onClick={() => setPicked(v)}
                      className={cn('group grid size-11 shrink-0 place-items-center rounded-field', on ? 'bg-accent-soft' : 'hover:bg-surface-2')}
                    >
                      <Ring id={v} bars={28} state={on ? 'on' : 'idle'} className={cn('size-8', !on && 'group-hover:text-text-2')} />
                    </button>
                  )
                })}
              </div>
            )
          }
          status={
            <JobStatus
              phase={job.phase}
              error={job.error}
              idle={error ? t.offline : t.idle}
              running={t.running}
              done={t.done.replace('{s}', `${seconds.toFixed(1)} s`)}
            />
          }
        />
      </div>
      <div className="stripes mt-12 h-5 md:mt-16" aria-hidden="true" />
    </section>
  )
}
