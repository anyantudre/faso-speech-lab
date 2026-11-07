import { useEffect, useState } from 'react'
import { Check, Headphones, Hourglass, Lock, Users } from 'lucide-react'
import { clipUrl, getRound, sendAnswers, type Answer, type Round } from '@/lib/api'
import { strings, useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'
import { Player } from '@/components/Player'
import { Ring } from '@/components/Ring'

const S = strings(
  {
    title: 'Rate the voices',
    lede: 'Do you speak Mooré? Help evaluate our speech models. Each round plays one sentence read by two or three models. Rate how natural each one sounds, then pick the best. Model names stay hidden so that ratings are fair.',
    anon: 'Your name and email are asked once, only to know who took part. They are kept apart from your ratings and never published.',
    time: 'About a minute per round. Do as many as you like and stop at any time.',
    phones: 'Headphones or earphones help, in a quiet place.',
    use: 'Answers are saved in a private dataset for a research paper. The rounds contain no real recordings, so scores compare the models with each other.',
    about: 'A few questions first',
    level: 'How well do you speak Mooré?',
    native: 'Mooré is my first language',
    fluent: 'I speak it fluently, but it is not my first language',
    some: 'I understand it, but do not speak it fluently',
    none: 'I do not speak Mooré',
    name: 'Your name',
    email: 'Email address (work or academic if possible)',
    nameHint: 'Both stay private, stored apart from your ratings, and are only used to contact you about this study.',
    region: 'Town or province where you grew up (optional)',
    device: 'What will you listen with?',
    headphones: 'Headphones or earphones',
    speakers: 'Phone or computer speaker',
    consent: 'I agree to take part. My name and email stay private and apart from my answers, which are used only for this research and published only as averages. I can stop at any time and ask for my answers to be deleted by writing to nyantudrealban@gmail.com.',
    start: 'Start',
    notFluent: 'This test is for people who speak Mooré fluently. Thank you for your interest. You can still try the other pages.',
    sentence: 'Sentence',
    voice: 'Voice',
    listen: 'Listen to the end to rate',
    scale: 'Bad|Poor|Fair|Good|Excellent',
    natural: 'How natural does it sound?',
    best: 'Which voice sounds best?',
    next: 'Save and next',
    finish: 'Finish',
    done: 'Rounds rated:',
    thanks: 'Thank you! Your ratings are saved. Come back any time for more rounds.',
    more: 'Rate more',
    none_: 'The clips for this test are being prepared. Please come back soon.',
    loading: 'Loading a round',
  },
  {
    title: 'Évaluer les voix',
    lede: "Vous parlez mooré ? Aidez-nous à évaluer nos modèles de parole. Chaque tour fait entendre une phrase lue par deux ou trois modèles. Notez le naturel de chacune, puis choisissez la meilleure. Les noms des modèles restent cachés pour que les notes soient justes.",
    anon: "Votre nom et votre e-mail sont demandés une seule fois, juste pour savoir qui a participé. Ils sont conservés à part de vos notes et jamais publiés.",
    time: "Environ une minute par tour. Faites-en autant que vous voulez et arrêtez quand vous voulez.",
    phones: 'Un casque ou des écouteurs aident, dans un endroit calme.',
    use: "Les réponses sont enregistrées dans un jeu de données privé pour un article de recherche. Les tours ne contiennent pas d'enregistrements réels : les notes comparent les modèles entre eux.",
    about: "Quelques questions d'abord",
    level: 'Quel est votre niveau en mooré ?',
    native: 'Le mooré est ma langue maternelle',
    fluent: "Je le parle couramment, mais ce n'est pas ma langue maternelle",
    some: 'Je le comprends, mais je ne le parle pas couramment',
    none: 'Je ne parle pas mooré',
    name: 'Votre nom',
    email: 'Adresse e-mail (professionnelle ou universitaire si possible)',
    nameHint: 'Les deux restent privés, conservés à part de vos notes, et ne servent qu’à vous contacter au sujet de cette étude.',
    region: 'Ville ou province où vous avez grandi (facultatif)',
    device: 'Avec quoi allez-vous écouter ?',
    headphones: 'Casque ou écouteurs',
    speakers: "Haut-parleur du téléphone ou de l'ordinateur",
    consent: "J'accepte de participer. Mon nom et mon e-mail restent privés et à part de mes réponses, qui servent uniquement à cette recherche et ne sont publiées que sous forme de moyennes. Je peux arrêter à tout moment et demander la suppression de mes réponses en écrivant à nyantudrealban@gmail.com.",
    start: 'Commencer',
    notFluent: "Ce test s'adresse aux personnes qui parlent couramment le mooré. Merci de votre intérêt. Vous pouvez essayer les autres pages.",
    sentence: 'Phrase',
    voice: 'Voix',
    listen: "Écoutez jusqu'au bout pour noter",
    scale: 'Mauvais|Médiocre|Moyen|Bon|Excellent',
    natural: 'Est-ce que ça sonne naturel ?',
    best: 'Quelle voix sonne le mieux ?',
    next: 'Enregistrer et continuer',
    finish: 'Terminer',
    done: 'Tours notés :',
    thanks: 'Merci ! Vos notes sont enregistrées. Revenez quand vous voulez pour d’autres tours.',
    more: 'Noter encore',
    none_: 'Les extraits de ce test sont en préparation. Revenez bientôt.',
    loading: "Chargement d'un tour",
  },
)

const KEY = 'fsl-rate-v2'
const LETTERS = ['A', 'B', 'C']
type Profile = { name: string; email: string; fluent: string; region: string; headphones: string }
type State = { participant: string; profile?: Profile; seen: string[]; clips: number; rounds: number }

const id = () => crypto.randomUUID()
const session = id()

function load(): State {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '')
    if (s.participant) return s
  } catch {
    /* first visit or private mode */
  }
  return { participant: id(), seen: [], clips: 0, rounds: 0 }
}

function persist(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* kept for this visit only */
  }
}

export default function Rate() {
  const t = useT(S)
  const [state, setState] = useState(load)
  const [finished, setFinished] = useState(false)
  const update = (patch: Partial<State>) =>
    setState((s) => {
      const next = { ...s, ...patch }
      persist(next)
      return next
    })
  const send = (answers: Answer[]) => sendAnswers(state.participant, session, answers)

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 md:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{t.title}</h1>
        {state.rounds > 0 && (
          <span className="font-mono text-sm text-text-3">
            {t.done} {state.rounds}
          </span>
        )}
      </div>
      <p className="mt-2 max-w-2xl text-text-2">{t.lede}</p>
      <ul className="mt-5 grid gap-px overflow-hidden rounded-card border border-border bg-border text-sm sm:grid-cols-2">
        {[
          [Lock, t.anon],
          [Hourglass, t.time],
          [Headphones, t.phones],
          [Users, t.use],
        ].map(([Icon, text]) => (
          <li key={text as string} className="flex gap-3 bg-surface p-4 text-text-2">
            <Icon className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
            {text as string}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {!state.profile ? (
          <ProfileForm
            onStart={async (profile) => {
              if (profile.fluent === 'none' || profile.fluent === 'some') return update({ profile: { ...profile, name: '', email: '' } })
              await send([{ tid: 'profile', part: 'profile', response: profile }])
              update({ profile: { ...profile, name: '', email: '' } })
            }}
          />
        ) : state.profile.fluent === 'none' || state.profile.fluent === 'some' ? (
          <Note>{t.notFluent}</Note>
        ) : finished ? (
          <Note>
            {t.thanks}
            <button type="button" onClick={() => setFinished(false)} className="mt-4 h-11 rounded-field border border-border-strong px-5 font-semibold hover:bg-surface-2">
              {t.more}
            </button>
          </Note>
        ) : (
          <Rounds
            state={state}
            send={send}
            onDone={(item, clips) => update({ seen: [...state.seen, item].slice(-200), clips: state.clips + clips, rounds: state.rounds + 1 })}
            onFinish={async () => {
              await send([{ tid: 'end', part: 'end' }]).catch(() => undefined)
              setFinished(true)
            }}
          />
        )}
      </div>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col items-start rounded-card border border-border bg-surface p-6 text-text-2">{children}</div>
}

function Choice({ name, value, current, onPick, children }: { name: string; value: string; current: string; onPick: (v: string) => void; children: React.ReactNode }) {
  return (
    <label className={cn('flex min-h-11 cursor-pointer items-center gap-3 rounded-field border px-3.5 py-2 text-sm', current === value ? 'border-accent bg-accent-soft' : 'border-border hover:border-border-strong')}>
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => onPick(value)} className="accent-[var(--accent)]" />
      {children}
    </label>
  )
}

function ProfileForm({ onStart }: { onStart: (p: Profile) => Promise<void> }) {
  const t = useT(S)
  const [p, setP] = useState<Profile>({ name: '', email: '', fluent: '', region: '', headphones: '' })
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const ready = p.name.trim().length >= 2 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email.trim()) && p.fluent && p.headphones && agree
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError('')
        await onStart(p).catch((err: Error) => setError(err.message))
        setBusy(false)
      }}
      className="grid gap-5 rounded-card border border-border bg-surface p-5 md:p-6"
    >
      <h2 className="text-lg font-bold">{t.about}</h2>
      <label className="grid gap-2 text-sm font-semibold">
        {t.name}
        <input required autoComplete="name" value={p.name} maxLength={80} onChange={(e) => setP({ ...p, name: e.target.value })} className="h-11 rounded-field border border-border-strong bg-bg px-3 font-normal" />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        {t.email}
        <input required type="email" autoComplete="email" value={p.email} maxLength={120} onChange={(e) => setP({ ...p, email: e.target.value })} className="h-11 rounded-field border border-border-strong bg-bg px-3 font-normal" />
        <span className="font-normal text-text-3">{t.nameHint}</span>
      </label>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-semibold">{t.level}</legend>
        {(['native', 'fluent', 'some', 'none'] as const).map((v) => (
          <Choice key={v} name="fluent" value={v} current={p.fluent} onPick={(fluent) => setP({ ...p, fluent })}>
            {t[v]}
          </Choice>
        ))}
      </fieldset>
      <label className="grid gap-2 text-sm font-semibold">
        {t.region}
        <input value={p.region} maxLength={60} onChange={(e) => setP({ ...p, region: e.target.value })} className="h-11 rounded-field border border-border-strong bg-bg px-3 font-normal" />
      </label>
      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold">{t.device}</legend>
        {(['headphones', 'speakers'] as const).map((v) => (
          <Choice key={v} name="device" value={v} current={p.headphones} onPick={(headphones) => setP({ ...p, headphones })}>
            {t[v]}
          </Choice>
        ))}
      </fieldset>
      <label className="flex items-start gap-3 text-sm text-text-2">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 size-4 accent-[var(--accent)]" />
        {t.consent}
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button type="submit" disabled={!ready || busy} className="h-12 rounded-field bg-accent px-6 font-bold text-accent-fg hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50 sm:justify-self-start">
        {t.start}
      </button>
    </form>
  )
}

type RoundsProps = { state: State; send: (a: Answer[]) => Promise<void>; onDone: (item: string, clips: number) => void; onFinish: () => void }

function Rounds({ state, send, onDone, onFinish }: RoundsProps) {
  const t = useT(S)
  const scale = t.scale.split('|')
  const [round, setRound] = useState<Round | null>()
  const [played, setPlayed] = useState<boolean[]>([])
  const [scores, setScores] = useState<number[]>([])
  const [best, setBest] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    getRound(state.seen)
      .then((r) => {
        if (!live) return
        setRound(r)
        setPlayed([])
        setScores([])
        setBest(undefined)
      })
      .catch(() => live && setRound(null))
    return () => {
      live = false
    }
  }, [state.seen])

  if (round === undefined)
    return (
      <div className="grid place-items-center py-16" aria-label={t.loading}>
        <Ring id="faso-speech-lab" state="spin" className="size-12" />
      </div>
    )
  if (round === null) return <Note>{t.none_}</Note>

  const n = round.stims.length
  const complete = scores.filter(Boolean).length === n && best

  const submit = async () => {
    setBusy(true)
    setError('')
    const answers: Answer[] = round.stims.map((stim, i) => ({
      tid: `mos-${state.clips + i + 1}`,
      part: 'mos',
      item: round.item,
      stims: [stim],
      response: { score: scores[i] },
      played_full: played[i],
      position: LETTERS[i],
    }))
    answers.push({ tid: `pick-${state.rounds + 1}`, part: 'pick', item: round.item, stims: round.stims, response: { best }, played_full: played.every(Boolean), position: LETTERS.slice(0, n).join('') })
    try {
      await send(answers)
      onDone(round.item, n)
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-card border border-border bg-surface p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-text-3">{t.sentence}</p>
        <p lang="mos" className="moore mt-2 text-xl leading-relaxed">
          {round.text}
        </p>
      </div>
      <div className={cn('grid gap-4', n === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
        {round.stims.map((stim, i) => (
          <div key={stim} className="grid gap-4 rounded-card border border-border bg-surface p-4">
            <b className="font-mono text-sm">
              {t.voice} {LETTERS[i]}
            </b>
            <Player url={clipUrl(stim)} synthetic={false} onFinish={() => setPlayed((p) => Object.assign([...p], { [i]: true }))} />
            <fieldset disabled={!played[i]} className="grid gap-2">
              <legend className="mb-2 text-sm font-semibold">{played[i] ? t.natural : t.listen}</legend>
              <div className="grid grid-cols-5 gap-1">
                {scale.map((label, k) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={scores[i] === k + 1}
                    title={label}
                    onClick={() => setScores((s) => Object.assign([...s], { [i]: k + 1 }))}
                    className={cn(
                      'grid h-12 place-items-center rounded-field border font-mono text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                      scores[i] === k + 1 ? 'border-text bg-text text-bg' : 'border-border-strong hover:bg-surface-2',
                    )}
                  >
                    {k + 1}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-text-3">
                <span>{scale[0]}</span>
                <span>{scale[4]}</span>
              </div>
            </fieldset>
          </div>
        ))}
      </div>
      <fieldset disabled={scores.filter(Boolean).length < n} className="rounded-card border border-border bg-surface p-5 disabled:opacity-50">
        <legend className="sr-only">{t.best}</legend>
        <p className="mb-3 text-sm font-semibold">{t.best}</p>
        <div className="flex flex-wrap gap-2">
          {round.stims.map((stim, i) => (
            <button
              key={stim}
              type="button"
              aria-pressed={best === stim}
              onClick={() => setBest(stim)}
              className={cn('inline-flex h-11 items-center gap-2 rounded-field border px-5 font-semibold', best === stim ? 'border-text bg-text text-bg' : 'border-border-strong hover:bg-surface-2')}
            >
              {best === stim && <Check className="size-4" aria-hidden="true" />}
              {t.voice} {LETTERS[i]}
            </button>
          ))}
        </div>
      </fieldset>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onFinish} className="h-12 rounded-field border border-border-strong px-5 font-semibold hover:bg-surface-2">
          {t.finish}
        </button>
        <button type="button" onClick={submit} disabled={!complete || busy} className="h-12 rounded-field bg-accent px-6 font-bold text-accent-fg hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50">
          {t.next}
        </button>
      </div>
    </div>
  )
}
