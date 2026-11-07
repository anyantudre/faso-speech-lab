import { lazy } from 'react'
import { AudioLines, FlaskConical, Languages, MessagesSquare, Mic, Repeat2, Scale, Speech } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Lang } from '@/lib/prefs'

/** Web side of the task plug-ins. A live task has a page; a planned one only shows on Home and in
 * the Roadmap menu. To add a task: add its server package, then an entry here with its page. */
type Label = Record<Lang, string>
export type WebTask = { id: string; path: string; icon: LucideIcon; label: Label; short: Label; page?: ReturnType<typeof lazy> }

export const LIVE: WebTask[] = [
  {
    id: 'tts',
    path: '/tts',
    icon: AudioLines,
    label: { en: 'Text to speech', fr: 'Synthèse vocale' },
    short: { en: 'Speak', fr: 'Synthèse' },
    page: lazy(() => import('./pages/Tts')),
  },
  {
    id: 'asr',
    path: '/asr',
    icon: Mic,
    label: { en: 'Speech to text', fr: 'Transcription' },
    short: { en: 'Transcribe', fr: 'Transcrire' },
    page: lazy(() => import('./pages/Asr')),
  },
  {
    id: 'rate',
    path: '/rate',
    icon: Scale,
    label: { en: 'Rate the voices', fr: 'Évaluer les voix' },
    short: { en: 'Rate', fr: 'Évaluer' },
    page: lazy(() => import('./pages/Rate')),
  },
]

export const MODELS: WebTask = {
  id: 'models',
  path: '/models',
  icon: FlaskConical,
  label: { en: 'Models', fr: 'Modèles' },
  short: { en: 'Models', fr: 'Modèles' },
  page: lazy(() => import('./pages/Models')),
}

export const PLANNED: WebTask[] = [
  { id: 'mt', path: '', icon: Languages, label: { en: 'Mooré-French translation', fr: 'Traduction mooré-français' }, short: { en: 'Translate', fr: 'Traduire' } },
  { id: 'st', path: '', icon: Speech, label: { en: 'Speech translation', fr: 'Traduction de la parole' }, short: { en: 'Speech translation', fr: 'Traduction orale' } },
  { id: 's2st', path: '', icon: Repeat2, label: { en: 'Speech-to-speech', fr: 'Parole à parole' }, short: { en: 'Speech-to-speech', fr: 'Parole à parole' } },
  { id: 'assistant', path: '', icon: MessagesSquare, label: { en: 'Voice assistant', fr: 'Assistant vocal' }, short: { en: 'Assistant', fr: 'Assistant' } },
]
