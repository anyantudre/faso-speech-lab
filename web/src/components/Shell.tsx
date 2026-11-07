import { Suspense } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import { ChevronDown, Home, Monitor, Moon, Sun } from 'lucide-react'
import { BrandIcon } from './BrandIcon'
import { Logo } from './Logo'
import { Ring } from './Ring'
import { Footer } from './Footer'
import { useDock } from './Dock'
import { LIVE, MODELS, PLANNED } from '@/tasks'
import { strings, usePrefs, useT, type Theme } from '@/lib/prefs'
import { LINKS } from '@/lib/links'
import { cn } from '@/lib/cn'

const S = strings(
  {
    home: 'Home',
    roadmap: 'Roadmap',
    planned: 'Planned tasks, not available yet.',
    soon: 'planned',
    github: 'Source code on GitHub',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    sections: 'Sections',
  },
  {
    home: 'Accueil',
    roadmap: 'Feuille de route',
    planned: 'Tâches prévues, pas encore disponibles.',
    soon: 'prévu',
    github: 'Code source sur GitHub',
    language: 'Langue',
    theme: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
    sections: 'Sections',
  },
)

const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' }
const THEME_ICON = { system: Monitor, light: Sun, dark: Moon }

function Prefs() {
  const { lang, setLang, theme, setTheme } = usePrefs()
  const t = useT(S)
  const Icon = THEME_ICON[theme]
  return (
    <div className="flex items-center gap-2">
      <div role="group" aria-label={t.language} className="flex rounded-field border border-border-strong p-0.5 text-xs font-bold">
        {(['en', 'fr'] as const).map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={lang === l}
            onClick={() => setLang(l)}
            className={cn('h-9 min-w-10 rounded-field px-2 uppercase', lang === l ? 'bg-text text-bg' : 'text-text-3 hover:text-text')}
          >
            {l}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setTheme(NEXT[theme])}
        aria-label={`${t.theme}: ${t[theme]}`}
        title={`${t.theme}: ${t[theme]}`}
        className="grid size-10 place-items-center rounded-field text-text-2 hover:bg-surface-2 hover:text-text"
      >
        <Icon className="size-[18px]" />
      </button>
    </div>
  )
}

function TopBar() {
  const { lang } = usePrefs()
  const t = useT(S)
  const link = ({ isActive }: { isActive: boolean }) =>
    cn('flex h-10 items-center gap-2 whitespace-nowrap rounded-field px-3 text-sm font-semibold transition-colors', isActive ? 'bg-accent-soft text-accent' : 'text-text-2 hover:text-text')
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2.5 whitespace-nowrap font-extrabold tracking-tight" aria-label="Faso Speech Lab">
          <Logo className="h-9 w-11" />
          <span>
            FasoSpeech <span className="font-medium text-text-3">Lab</span>
          </span>
        </Link>
        <nav aria-label={t.sections} className="ml-2 hidden items-center gap-1 md:flex lg:ml-4">
          {[...LIVE, MODELS].map((x) => (
            <NavLink key={x.id} to={x.path} className={link} title={x.label[lang]}>
              <x.icon className="size-4" aria-hidden="true" />
              <span className="sr-only xl:not-sr-only">{x.label[lang]}</span>
            </NavLink>
          ))}
          <details className="group relative">
            <summary className="flex h-10 cursor-pointer list-none items-center gap-1 whitespace-nowrap rounded-field px-3 text-sm font-semibold text-text-3 hover:text-text">
              {t.roadmap}
              <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="absolute left-0 top-12 w-72 rounded-card border border-border bg-surface p-3 shadow-lift">
              <p className="px-2 pb-2 text-xs text-text-3">{t.planned}</p>
              <ul>
                {PLANNED.map((x) => (
                  <li key={x.id} className="flex items-center gap-2.5 rounded-field px-2 py-2 text-sm text-text-2">
                    <x.icon className="size-4 text-text-3" aria-hidden="true" />
                    <span className="flex-1">{x.label[lang]}</span>
                    <span className="rounded-field border border-border px-2 py-0.5 font-mono text-[11px] text-text-3">{t.soon}</span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <a href={LINKS.github} target="_blank" rel="noreferrer" aria-label={t.github} className="hidden size-10 place-items-center rounded-field text-text-2 hover:bg-surface-2 hover:text-text sm:grid">
            <BrandIcon name="github" className="size-[18px]" />
          </a>
          <Prefs />
        </div>
      </div>
    </header>
  )
}

function TabBar() {
  const { lang } = usePrefs()
  const t = useT(S)
  const items = [{ id: 'home', path: '/', icon: Home, short: { en: t.home, fr: t.home } }, ...LIVE, MODELS]
  return (
    <nav aria-label={t.sections} className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t border-border bg-bg-2 md:hidden">
      {items.map((x) => (
        <NavLink
          key={x.id}
          to={x.path}
          end={x.path === '/'}
          className={({ isActive }) => cn('flex flex-col items-center justify-center gap-1 text-[11px] font-bold', isActive ? 'text-accent' : 'text-text-3')}
        >
          <x.icon className="size-5" aria-hidden="true" />
          {x.short[lang]}
        </NavLink>
      ))}
    </nav>
  )
}

function Loading() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Ring id="faso-speech-lab" state="spin" className="size-14" />
    </div>
  )
}

export function Shell() {
  return (
    <div className="flex min-h-dvh flex-col pb-16 md:pb-0">
      <TopBar />
      <main className="flex-1">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      {useDock().clip && <div className="h-20" aria-hidden="true" />}
      <TabBar />
    </div>
  )
}
