import { useEffect, useRef, useState } from 'react'
import WaveSurfer from 'wavesurfer.js'
import { Pause, Play, Sparkles } from 'lucide-react'
import { strings, useT } from '@/lib/prefs'
import { cn } from '@/lib/cn'

const S = strings(
  { play: 'Play', pause: 'Pause', synthetic: 'Synthetic audio' },
  { play: 'Lire', pause: 'Pause', synthetic: 'Audio synthétique' },
)

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

type Props = {
  url: string
  autoplay?: boolean
  synthetic?: boolean
  compact?: boolean
  onFinish?: () => void
  className?: string
}

export function Player({ url, autoplay, synthetic = true, compact, onFinish, className }: Props) {
  const t = useT(S)
  const box = useRef<HTMLDivElement>(null)
  const ws = useRef<WaveSurfer>(null)
  const finished = useRef(onFinish)
  useEffect(() => {
    finished.current = onFinish
  })
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState({ now: 0, total: 0 })

  useEffect(() => {
    const css = getComputedStyle(document.documentElement)
    const w = WaveSurfer.create({
      container: box.current!,
      url,
      height: compact ? 32 : 56,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      cursorWidth: 0,
      waveColor: css.getPropertyValue('--border-strong'),
      progressColor: css.getPropertyValue('--accent'),
      autoplay,
    })
    w.on('ready', (d) => setTime({ now: 0, total: d }))
    w.on('timeupdate', (now) => setTime((x) => ({ ...x, now })))
    w.on('play', () => setPlaying(true))
    w.on('pause', () => setPlaying(false))
    w.on('finish', () => {
      setPlaying(false)
      finished.current?.()
    })
    ws.current = w
    return () => w.destroy()
  }, [url, autoplay, compact])

  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <button
        type="button"
        onClick={() => ws.current?.playPause()}
        aria-label={playing ? t.pause : t.play}
        className="grid size-11 shrink-0 place-items-center rounded-field border border-border-strong bg-surface text-text transition hover:bg-surface-2 active:scale-95"
      >
        {playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
      </button>
      <div className="min-w-0 flex-1">
        <div ref={box} />
        {!compact && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-3">
            <span className="whitespace-nowrap font-mono tabular-nums">
              {fmt(time.now)} / {fmt(time.total)}
            </span>
            {synthetic && <SyntheticTag />}
          </div>
        )}
      </div>
      {compact && (
        <span className="hidden font-mono text-xs tabular-nums text-text-3 sm:inline">
          {fmt(time.now)} / {fmt(time.total)}
        </span>
      )}
      {compact && synthetic && <SyntheticTag className="hidden md:inline-flex" />}
    </div>
  )
}

export function SyntheticTag({ className }: { className?: string }) {
  const t = useT(S)
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-field border border-border px-2 py-0.5 text-xs text-text-2', className)}>
      <Sparkles className="size-3" aria-hidden="true" />
      {t.synthetic}
    </span>
  )
}
