import { Client, handle_file } from '@gradio/client'

export type Task = { id: string; name: string; summary: string; status: 'live' | 'soon' }
export type Model = {
  id: string
  task: string
  name: string
  repo: string
  base: string
  summary: string
  device: 'cpu' | 'gpu'
  cloning: boolean
  voices: string[]
  scores: Record<string, number>
  samples: string[]
  licence: string
  default: boolean
  sampling: boolean
  available: boolean
}
export type BenchRow = { id: string; name: string; test: number; test_unseen?: number; reference?: boolean; repo?: string }
export type Catalog = {
  gpu: boolean
  tasks: Task[]
  models: Model[]
  benchmark: { dataset: string; hours: number; rows: BenchRow[] }
}
export type Speech = { audio: { url: string }; seconds: number; elapsed: number; run: string }
export type Word = { word: string; confidence: number }
export type Transcript = { text: string; words: Word[]; seconds: number; elapsed: number; run: string }

export const getCatalog = (): Promise<Catalog> => fetch('/api/catalog').then((r) => r.json())

let client: Promise<Client> | undefined
const connect = () => (client ??= Client.connect(window.location.origin))

async function call<T>(endpoint: string, data: Record<string, unknown>): Promise<T> {
  const result = await (await connect()).predict(endpoint, data)
  return (result.data as T[])[0]
}

export const speak = (p: {
  text: string
  model: string
  voice: string
  speed: number
  reference?: Blob | null
  referenceText?: string
  seed?: number
  keepReference?: boolean
  source?: 'typed' | 'example'
  lang?: string
}) =>
  call<Speech>('/tts', {
    text: p.text,
    model: p.model,
    voice: p.voice,
    speed: p.speed,
    reference: p.reference ? handle_file(p.reference) : null,
    reference_text: p.referenceText ?? '',
    seed: p.seed ?? 0,
    keep_reference: p.keepReference ?? false,
    source: p.source ?? 'typed',
    lang: p.lang ?? 'en',
  })

export const transcribe = (audio: Blob, model = 'w2v-bert', keep = false, lang = 'en') =>
  call<Transcript>('/asr', { audio: handle_file(audio), model, keep, lang })

export type Round = { item: string; text: string; stims: string[] }
export type Answer = { tid: string; part: 'profile' | 'mos' | 'pick' | 'end'; item?: string; stims?: string[]; response?: Record<string, unknown>; played_full?: boolean; position?: string }

export const getRound = (skip: string[]): Promise<Round | null> =>
  fetch(`/api/rate/round?skip=${encodeURIComponent(skip.join(','))}`).then((r) => (r.ok ? r.json() : null))
export const sendAnswers = async (participant: string, session_id: string, answers: Answer[]) => {
  const r = await fetch('/api/rate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ participant, session_id, answers }) })
  if (!r.ok) throw new Error('Your answers could not be saved. Check your connection and try again.')
}
export type Vote = {
  run: string
  task: 'tts' | 'asr'
  model: string
  vote?: 'up' | 'down'
  run_b?: string
  winner?: 'a' | 'b' | 'tie'
  tags: string[]
  correction: string
  native?: boolean | null
  rater: string
}
export const sendFeedback = async (v: Vote) => {
  const r = await fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(v) })
  if (!r.ok) throw new Error(String(r.status))
}
export const clipUrl = (stim: string) => `/api/rate/clip/${stim}`
export const sampleUrl = (model: string, n: number) => `/api/sample/${model}/${n}`
export const voiceUrl = (model: string, n: number) => `/api/voice/${model}/${n}`
