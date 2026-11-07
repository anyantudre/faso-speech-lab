import { useCallback, useRef, useState } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { Ring } from './Ring'
import { strings, useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'

const S = strings(
  {
    warming: 'Warming up the model, the first run can take a minute or two.',
    failed: 'Something went wrong. Try again.',
  },
  {
    warming: "Préparation du modèle : la première exécution peut prendre une à deux minutes.",
    failed: 'Un problème est survenu. Réessayez.',
  },
)

export type Phase = 'idle' | 'running' | 'warming' | 'done' | 'error'

const WARM_AFTER_MS = 4000

/** Runs one request at a time. After a few seconds without an answer the phase becomes `warming`:
 * the first request after a restart downloads and loads the model. */
export function useJob() {
  const t = useT(S)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const live = useRef(false)

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
      if (live.current) return
      live.current = true
      setPhase('running')
      setError('')
      const timer = setTimeout(() => setPhase((p) => (p === 'running' ? 'warming' : p)), WARM_AFTER_MS)
      try {
        const out = await fn()
        setPhase('done')
        return out
      } catch (e) {
        setError((e instanceof Error && e.message) || t.failed)
        setPhase('error')
      } finally {
        clearTimeout(timer)
        live.current = false
      }
    },
    [t.failed],
  )

  const fail = useCallback((message: string) => {
    setError(message)
    setPhase('error')
  }, [])

  return { phase, error, busy: phase === 'running' || phase === 'warming', run, fail }
}

/** Ring state that matches a phase: breathing while running, spinning while the model warms up. */
export const ringState = (p: Phase) => (p === 'warming' ? 'spin' : p === 'running' ? 'busy' : 'idle')

type Props = { phase: Phase; error?: string; running: string; done?: string; idle?: string; className?: string }

export function JobStatus({ phase, error, running, done, idle, className }: Props) {
  const t = useT(S)
  const busy = phase === 'running' || phase === 'warming'
  const text = { idle, running, warming: t.warming, done, error }[phase]
  if (!text) return null
  return (
    <p className={cn('flex items-start gap-2.5', phase === 'error' ? 'text-danger' : 'text-text-2', className)}>
      {busy && <Ring id="faso-speech-lab" bars={24} state={phase === 'warming' ? 'spin' : 'busy'} className="size-5 shrink-0" />}
      {phase === 'error' && <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
      {phase === 'done' && <CircleCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />}
      <span>{text}</span>
    </p>
  )
}
