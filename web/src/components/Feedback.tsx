import { useState } from 'react'
import { Check, ThumbsDown, ThumbsUp } from 'lucide-react'
import { sendFeedback, type Vote } from '@/lib/api'
import { strings, useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'

const S = strings(
  {
    ask: 'Was this right?',
    up: 'Good',
    down: 'Not good',
    good: 'What was good? (optional)',
    what: 'What was wrong? (optional)',
    fix: 'Correct transcript (optional, it helps a lot)',
    native: 'Mooré is my first language',
    send: 'Send',
    thanks: 'Thank you, noted for future training.',
    failed: 'Could not send. Try again.',
    which: 'Which take is better?',
    diff: 'What made the difference? (optional)',
    better: '#{n} is better',
    same: 'About the same',
    natural: 'Natural',
    clear: 'Clear',
    mispronounced: 'Mispronounced word',
    skipped_word: 'Skipped or wrong word',
    wrong_tone: 'Wrong tone',
    robotic: 'Robotic',
    noise: 'Noise or glitch',
    rhythm: 'Odd rhythm',
    cut_off: 'Cut off at the end',
    wrong_voice: 'Wrong voice',
    wrong_words: 'Wrong words',
    missing_words: 'Missing words',
    extra_words: 'Extra words',
    spelling: 'Spelling',
  },
  {
    ask: 'Est-ce correct ?',
    up: 'Bien',
    down: 'Pas bien',
    good: "Qu'est-ce qui était bien ? (facultatif)",
    what: "Qu'est-ce qui n'allait pas ? (facultatif)",
    fix: 'Transcription correcte (facultative, très utile)',
    native: 'Le mooré est ma langue maternelle',
    send: 'Envoyer',
    thanks: "Merci, c'est noté pour de futurs entraînements.",
    failed: "L'envoi a échoué. Réessayez.",
    which: 'Quelle prise est meilleure ?',
    diff: 'Qu’est-ce qui a fait la différence ? (facultatif)',
    better: '#{n} est meilleure',
    same: 'À peu près pareil',
    natural: 'Naturel',
    clear: 'Clair',
    mispronounced: 'Mot mal prononcé',
    skipped_word: 'Mot sauté ou erroné',
    wrong_tone: 'Mauvais ton',
    robotic: 'Robotique',
    noise: 'Bruit ou défaut',
    rhythm: 'Rythme étrange',
    cut_off: 'Coupé à la fin',
    wrong_voice: 'Mauvaise voix',
    wrong_words: 'Mots erronés',
    missing_words: 'Mots manquants',
    extra_words: 'Mots en trop',
    spelling: 'Orthographe',
  },
)

type Tag = Exclude<keyof typeof S.en, 'ask' | 'up' | 'down' | 'good' | 'what' | 'fix' | 'native' | 'send' | 'thanks' | 'failed' | 'which' | 'diff' | 'better' | 'same'>
const TAGS: Record<'tts' | 'asr', Record<'up' | 'down', Tag[]>> = {
  tts: { up: ['natural', 'clear'], down: ['mispronounced', 'skipped_word', 'wrong_tone', 'robotic', 'noise', 'rhythm', 'cut_off', 'wrong_voice'] },
  asr: { up: [], down: ['wrong_words', 'missing_words', 'extra_words', 'spelling'] },
}

function rater() {
  try {
    const id = localStorage.getItem('fsl-rater') ?? crypto.randomUUID()
    localStorage.setItem('fsl-rater', id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

const chip = (on: boolean) =>
  cn('inline-flex h-9 items-center gap-1.5 rounded-field border px-3 text-sm font-semibold', on ? 'border-text bg-text text-bg' : 'border-border-strong text-text-2 hover:bg-surface-2')

function useSend() {
  const [state, setState] = useState<'open' | 'sending' | 'sent' | 'failed'>('open')
  const send = async (v: Omit<Vote, 'rater'>) => {
    setState('sending')
    try {
      await sendFeedback({ ...v, rater: rater() })
      setState('sent')
    } catch {
      setState('failed')
    }
  }
  return { state, send }
}

function Sent({ className }: { className?: string }) {
  const t = useT(S)
  return (
    <p className={cn('flex items-center gap-2 text-sm text-text-2', className)}>
      <Check className="size-4 text-accent" aria-hidden="true" />
      {t.thanks}
    </p>
  )
}

function Tags({ options, value, onChange, legend }: { options: Tag[]; value: string[]; onChange: (v: string[]) => void; legend: string }) {
  const t = useT(S)
  if (options.length === 0) return null
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((tag) => {
          const on = value.includes(tag)
          return (
            <button key={tag} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== tag) : [...value, tag])} className={chip(on)}>
              {t[tag]}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

type Props = { run: string; task: 'tts' | 'asr'; model: string; transcript?: string; className?: string }

/** Good or not good on one output, with optional tags; for ASR, a corrected transcript. */
export function Feedback({ run, task, model, transcript = '', className }: Props) {
  const t = useT(S)
  const { state, send } = useSend()
  const [vote, setVote] = useState<'up' | 'down'>()
  const [tags, setTags] = useState<string[]>([])
  const [correction, setCorrection] = useState(transcript)
  const [native, setNative] = useState(false)

  if (state === 'sent') return <Sent className={className} />
  const options = vote ? TAGS[task][vote] : []
  const submit = (v: 'up' | 'down') => {
    const fixed = v === 'down' && correction.trim() !== transcript ? correction : ''
    send({ run, task, model, vote: v, tags, correction: fixed, native: fixed ? native : null })
  }
  const pick = (v: 'up' | 'down') => {
    setVote(v)
    setTags([])
    if (task === 'asr' && v === 'up') submit(v)
  }

  return (
    <div className={cn('grid gap-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-text-3">{t.ask}</span>
        <button type="button" aria-pressed={vote === 'up'} disabled={state === 'sending'} onClick={() => pick('up')} className={chip(vote === 'up')}>
          <ThumbsUp className="size-4" aria-hidden="true" />
          {t.up}
        </button>
        <button type="button" aria-pressed={vote === 'down'} disabled={state === 'sending'} onClick={() => pick('down')} className={chip(vote === 'down')}>
          <ThumbsDown className="size-4" aria-hidden="true" />
          {t.down}
        </button>
      </div>
      {vote && (options.length > 0 || (task === 'asr' && vote === 'down')) && (
        <div className="grid gap-3 rounded-field border border-border bg-surface-2 p-3">
          <Tags options={options} value={tags} onChange={setTags} legend={vote === 'up' ? t.good : t.what} />
          {task === 'asr' && vote === 'down' && (
            <>
              <label className="grid gap-2 text-sm font-semibold">
                {t.fix}
                <textarea lang="mos" rows={3} value={correction} maxLength={2000} onChange={(e) => setCorrection(e.target.value)} className="moore rounded-field border border-border-strong bg-bg px-3 py-2 text-base font-normal" />
              </label>
              <label className="flex items-center gap-2 text-sm text-text-2">
                <input type="checkbox" checked={native} onChange={(e) => setNative(e.target.checked)} className="size-4 accent-[var(--accent)]" />
                {t.native}
              </label>
            </>
          )}
          <button type="button" disabled={state === 'sending'} onClick={() => submit(vote)} className="h-10 justify-self-start rounded-field bg-accent px-5 text-sm font-bold text-accent-fg hover:bg-accent-strong disabled:opacity-50">
            {t.send}
          </button>
        </div>
      )}
      {state === 'failed' && <p className="text-sm text-danger">{t.failed}</p>}
    </div>
  )
}

type Take = { run: string; n: number }

/** Two takes of the same text and voice: which one is better. Rows for preference tuning. */
export function PairFeedback({ a, b, model, className }: { a: Take; b: Take; model: string; className?: string }) {
  const t = useT(S)
  const { state, send } = useSend()
  const [winner, setWinner] = useState<'a' | 'b' | 'tie'>()
  const [tags, setTags] = useState<string[]>([])

  if (state === 'sent') return <Sent className={className} />
  const label = (x: Take) => t.better.replace('{n}', String(x.n).padStart(2, '0'))
  return (
    <div className={cn('grid gap-3 rounded-field border border-border bg-surface-2 p-3', className)}>
      <p className="text-sm font-semibold">{t.which}</p>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['a', label(a)],
            ['b', label(b)],
            ['tie', t.same],
          ] as const
        ).map(([k, text]) => (
          <button key={k} type="button" aria-pressed={winner === k} onClick={() => setWinner(k)} className={chip(winner === k)}>
            {text}
          </button>
        ))}
      </div>
      {winner && (
        <>
          <Tags options={[...TAGS.tts.up, ...TAGS.tts.down]} value={tags} onChange={setTags} legend={t.diff} />
          <button
            type="button"
            disabled={state === 'sending'}
            onClick={() => send({ run: a.run, run_b: b.run, winner, task: 'tts', model, tags, correction: '' })}
            className="h-10 justify-self-start rounded-field bg-accent px-5 text-sm font-bold text-accent-fg hover:bg-accent-strong disabled:opacity-50"
          >
            {t.send}
          </button>
        </>
      )}
      {state === 'failed' && <p className="text-sm text-danger">{t.failed}</p>}
    </div>
  )
}
