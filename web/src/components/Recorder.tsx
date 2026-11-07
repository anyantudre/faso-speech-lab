import { useEffect, useRef, useState, type DragEvent } from 'react'
import { FileAudio, Mic, RotateCcw, Square, Upload } from 'lucide-react'
import { toWav } from '@/lib/wav'
import { Player } from './Player'
import { strings, useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'

const S = strings(
  {
    source: 'Audio source',
    upload: 'Upload',
    record: 'Record',
    drop: 'Drop an audio clip here, or',
    browse: 'browse',
    formats: 'WAV, MP3, FLAC, OGG, M4A',
    start: 'Start recording',
    stop: 'Stop recording',
    ready: 'Ready to record',
    recording: 'Recording',
    local: 'The clip stays in this tab until you send it.',
    max: 'max',
    reading: 'Reading the clip',
    replace: 'Replace',
    denied: 'The microphone is not available. Allow it in the browser, or upload a file.',
    unreadable: 'This file could not be read as audio.',
  },
  {
    source: 'Source audio',
    upload: 'Importer',
    record: 'Enregistrer',
    drop: 'Déposez un extrait audio ici, ou',
    browse: 'parcourez',
    formats: 'WAV, MP3, FLAC, OGG, M4A',
    start: "Démarrer l'enregistrement",
    stop: "Arrêter l'enregistrement",
    ready: 'Prêt à enregistrer',
    recording: 'Enregistrement',
    local: "L'extrait reste dans cet onglet jusqu'à son envoi.",
    max: 'max',
    reading: "Lecture de l'extrait",
    replace: 'Remplacer',
    denied: "Le micro n'est pas disponible. Autorisez-le dans le navigateur, ou importez un fichier.",
    unreadable: "Ce fichier n'a pas pu être lu comme de l'audio.",
  },
)

export type AudioClip = { wav: Blob; seconds: number; name: string }

type Props = {
  sampleRate: number
  maxSeconds: number
  onChange: (clip: AudioClip | null) => void
  className?: string
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

/** Upload or record one clip, always handed over as mono WAV at `sampleRate`. */
export function Recorder({ sampleRate, maxSeconds, onChange, className }: Props) {
  const t = useT(S)
  const [mode, setMode] = useState<'upload' | 'record'>('upload')
  const [clip, setClip] = useState<AudioClip & { url: string }>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (clip) return () => URL.revokeObjectURL(clip.url)
  }, [clip])

  const accept = async (blob: Blob, name: string) => {
    setBusy(true)
    setError('')
    try {
      const { wav, seconds } = await toWav(blob, sampleRate, maxSeconds)
      setClip({ wav, seconds, name, url: URL.createObjectURL(wav) })
      onChange({ wav, seconds, name })
    } catch {
      setError(t.unreadable)
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setClip(undefined)
    onChange(null)
  }

  if (clip)
    return (
      <div className={className}>
        <div className="grid gap-2 rounded-field border border-border bg-surface-2 p-3">
          <div className="flex items-center justify-between gap-2 text-xs text-text-3">
            <span className="truncate font-mono">{clip.name}</span>
            <button type="button" onClick={reset} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-field px-3 font-semibold text-text-2 hover:bg-surface-3 hover:text-text">
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {t.replace}
            </button>
          </div>
          <Player url={clip.url} synthetic={false} />
        </div>
      </div>
    )

  return (
    <div className={cn('grid gap-3', className)}>
      <div role="group" aria-label={t.source} className="grid grid-cols-2 rounded-field border border-border-strong bg-surface p-0.5">
        {(['upload', 'record'] as const).map((m) => {
          const Icon = m === 'upload' ? Upload : Mic
          return (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn('flex h-10 items-center justify-center gap-2 rounded-field text-sm font-semibold', mode === m ? 'bg-text text-bg' : 'text-text-2 hover:text-text')}
            >
              <Icon className="size-4" aria-hidden="true" />
              {t[m]}
            </button>
          )
        })}
      </div>
      {mode === 'upload' ? (
        <Dropzone disabled={busy} onFile={(f) => accept(f, f.name)} />
      ) : (
        <Capture maxSeconds={maxSeconds} disabled={busy} onDone={(b) => accept(b, `${t.recording.toLowerCase()}.wav`)} onError={() => setError(t.denied)} />
      )}
      <p aria-live="polite" className={cn('text-sm', error ? 'text-danger' : 'text-text-3')}>
        {error || (busy ? t.reading : '')}
      </p>
    </div>
  )
}

function Dropzone({ disabled, onFile }: { disabled: boolean; onFile: (f: File) => void }) {
  const t = useT(S)
  const [over, setOver] = useState(false)
  const drop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      className={cn(
        'grid cursor-pointer justify-items-center gap-2 rounded-field border border-dashed px-4 py-7 text-center text-sm text-text-2 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent',
        over ? 'border-accent bg-accent-soft' : 'border-border-strong bg-surface-2 hover:border-accent',
      )}
    >
      <FileAudio className="size-7 text-text-3" aria-hidden="true" />
      <span>
        {t.drop} <span className="font-semibold text-accent underline underline-offset-4">{t.browse}</span>
      </span>
      <small className="font-mono text-xs text-text-3">{t.formats}</small>
      <input
        type="file"
        accept="audio/*,.wav,.mp3,.flac,.ogg,.m4a"
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) onFile(f)
        }}
      />
    </label>
  )
}

function Capture({ maxSeconds, disabled, onDone, onError }: { maxSeconds: number; disabled: boolean; onDone: (b: Blob) => void; onError: () => void }) {
  const t = useT(S)
  const rec = useRef<MediaRecorder>(null)
  const [elapsed, setElapsed] = useState<number>()

  useEffect(() => () => rec.current?.stream.getTracks().forEach((x) => x.stop()), [])

  useEffect(() => {
    if (elapsed == null) return
    if (elapsed >= maxSeconds) return rec.current?.stop()
    const id = setTimeout(() => setElapsed(elapsed + 1), 1000)
    return () => clearTimeout(id)
  }, [elapsed, maxSeconds])

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const r = new MediaRecorder(stream)
      const chunks: Blob[] = []
      r.ondataavailable = (e) => chunks.push(e.data)
      r.onstop = () => {
        stream.getTracks().forEach((x) => x.stop())
        setElapsed(undefined)
        onDone(new Blob(chunks, { type: r.mimeType }))
      }
      r.start()
      rec.current = r
      setElapsed(0)
    } catch {
      onError()
    }
  }

  const on = elapsed != null
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-field border border-border p-4">
      <button
        type="button"
        disabled={disabled}
        onClick={on ? () => rec.current?.stop() : start}
        aria-label={on ? t.stop : t.start}
        className={cn('grid size-14 place-items-center rounded-field border transition active:scale-95', on ? 'border-danger bg-danger-soft text-danger' : 'border-border-strong bg-surface text-danger')}
      >
        {on ? <Square className="size-5" fill="currentColor" /> : <Mic className="size-6" />}
      </button>
      <div aria-live="polite">
        <p className="font-semibold">{on ? t.recording : t.ready}</p>
        <p className="text-sm text-text-3">{t.local}</p>
      </div>
      <span className="font-mono text-sm tabular-nums text-text-3">
        {clock(elapsed ?? 0)}
        <span className="block text-[11px]">
          {t.max} {clock(maxSeconds)}
        </span>
      </span>
    </div>
  )
}
