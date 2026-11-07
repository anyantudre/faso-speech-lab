import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import { X } from 'lucide-react'
import { Player } from './Player'
import { Ring } from './Ring'
import { strings, useT } from '@/lib/prefs'

export type Clip = { url: string; text: string; model: string; voice: string; voiceLabel: string }

type Dock = { clip?: Clip; show: (clip: Clip, from?: HTMLElement | null) => void; clear: () => void }
const Ctx = createContext<Dock>({ show: () => {}, clear: () => {} })
export const useDock = () => useContext(Ctx)

const S = strings({ close: 'Close player' }, { close: 'Fermer le lecteur' })
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

/** The last generated clip stays playable at the bottom of the page. On generate, the voice ring
 * flies from the composer into the dock (shared element). Navigating to another page clears it. */
export function DockProvider({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState<{ clip: Clip; path: string }>()
  const from = useRef<HTMLElement | null>(null)
  const target = useRef<HTMLSpanElement>(null)
  const { pathname } = useLocation()
  const t = useT(S)

  const clip = shown?.path === pathname ? shown.clip : undefined

  const show = useCallback(
    (c: Clip, el?: HTMLElement | null) => {
      from.current = el && !reduced() ? el : null
      setShown({ clip: c, path: pathname })
    },
    [pathname],
  )

  useLayoutEffect(() => {
    const src = from.current
    const dst = target.current
    if (!clip || !src || !dst) return
    from.current = null
    const a = src.getBoundingClientRect()
    const b = dst.getBoundingClientRect()
    const fly = src.cloneNode(true) as HTMLElement
    fly.className = src.className.replace(/\b(busy|spin)\b/g, '') + ' text-accent'
    Object.assign(fly.style, { position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`, zIndex: '60', pointerEvents: 'none', margin: '0' })
    document.body.append(fly)
    dst.style.opacity = '0'
    const dx = b.left + b.width / 2 - (a.left + a.width / 2)
    const dy = b.top + b.height / 2 - (a.top + a.height / 2)
    const anim = fly.animate(
      [
        { transform: 'translate(0,0) scale(1)' },
        { transform: 'translate(0,-8px) scale(1.35)', offset: 0.22 },
        { transform: `translate(${dx}px,${dy}px) scale(${b.width / a.width})` },
      ],
      { duration: 820, easing: 'cubic-bezier(.65,0,.25,1)' },
    )
    anim.onfinish = () => {
      fly.remove()
      dst.style.opacity = ''
    }
    return () => anim.cancel()
  }, [clip])

  const clear = useCallback(() => setShown(undefined), [])

  return (
    <Ctx.Provider value={{ clip, show, clear }}>
      {children}
      {clip && (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-border bg-bg-2/95 backdrop-blur md:bottom-0">
          <div className="stripes h-1 opacity-70" aria-hidden="true" />
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 md:gap-4">
            <span ref={target} className="inline-flex">
              <Ring id={clip.voice} state="on" className="size-10" />
            </span>
            <div className="hidden min-w-0 max-w-56 sm:block">
              <p className="moore truncate text-sm font-medium">{clip.text}</p>
              <p className="truncate text-xs text-text-3">
                {clip.model} · {clip.voiceLabel}
              </p>
            </div>
            <Player key={clip.url} url={clip.url} autoplay compact className="flex-1" />
            <button type="button" onClick={clear} aria-label={t.close} className="grid size-11 place-items-center rounded-field text-text-3 hover:text-text">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
