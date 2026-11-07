import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'fr'
export type Theme = 'system' | 'light' | 'dark'
function stored<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  try {
    const v = localStorage.getItem(key) as T | null
    return v && allowed.includes(v) ? v : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* private mode: preference lasts for this visit only */
  }
}

type Prefs = {
  lang: Lang
  theme: Theme
  setLang: (l: Lang) => void
  setTheme: (t: Theme) => void
}

const Ctx = createContext<Prefs | null>(null)

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => stored('fsl-lang', 'en', ['en', 'fr']))
  const [theme, setTheme] = useState<Theme>(() => stored('fsl-theme', 'system', ['system', 'light', 'dark']))
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => setSystemDark(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    const dark = theme === 'dark' || (theme === 'system' && systemDark)
    const root = document.documentElement
    root.dataset.theme = dark ? 'dark' : 'light'
    root.lang = lang
    save('fsl-lang', lang)
    save('fsl-theme', theme)
  }, [lang, theme, systemDark])

  return <Ctx.Provider value={{ lang, theme, setLang, setTheme }}>{children}</Ctx.Provider>
}

export function usePrefs() {
  const p = useContext(Ctx)
  if (!p) throw new Error('usePrefs outside PrefsProvider')
  return p
}

/** Each module owns its strings: `const S = strings({...en}, {...fr})`, then `const t = useT(S)`. */
export function strings<E extends Record<string, string>>(en: E, fr: { [K in keyof E]: string }) {
  return { en, fr: fr as E }
}

export function useT<E>(s: { en: E; fr: E }): E {
  return s[usePrefs().lang]
}
