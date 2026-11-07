import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { strings, useT } from '@/lib/prefs'
import { LINKS } from '@/lib/links'

const KEY = 'fsl-terms-v3'

const S = strings(
  {
    title: 'Before you generate speech',
    intro: 'Faso Speech Lab is an independent, non-commercial research project on Mooré speech technology. By continuing, you agree to the following.',
    t1: 'The models are experimental. They make mistakes and can mispronounce words.',
    t2: 'Generated audio is synthetic. Say so clearly whenever you share it.',
    t3: "Do not clone or imitate a real person's voice without their consent.",
    t4: 'Do not use the models for deepfakes, fraud, impersonation, harassment or political misinformation.',
    t5: 'Models are shared under CC BY-NC 4.0: research and non-commercial use only.',
    t6: 'For research and to prevent misuse, the text and results of each run are saved in a private dataset that only the author can read. Your own recordings are kept only if you tick the box that allows it. Do not enter personal information.',
    licence: 'Read the licence',
    cancel: 'Cancel',
    agree: 'I agree',
  },
  {
    title: 'Avant de générer de la parole',
    intro: 'Faso Speech Lab est un projet de recherche indépendant et non commercial sur les technologies de la parole en mooré. En continuant, vous acceptez ce qui suit.',
    t1: 'Les modèles sont expérimentaux. Ils font des erreurs et peuvent mal prononcer certains mots.',
    t2: "L'audio généré est synthétique. Dites-le clairement chaque fois que vous le partagez.",
    t3: "Ne clonez pas et n'imitez pas la voix d'une personne réelle sans son consentement.",
    t4: "N'utilisez pas les modèles pour des hypertrucages, la fraude, l'usurpation d'identité, le harcèlement ou la désinformation politique.",
    t5: "Les modèles sont partagés sous licence CC BY-NC 4.0 : recherche et usage non commercial uniquement.",
    t6: "Pour la recherche et pour prévenir les abus, le texte et les résultats de chaque exécution sont enregistrés dans un jeu de données privé que seul l'auteur peut lire. Vos propres enregistrements ne sont conservés que si vous cochez la case qui l'autorise. N'y mettez pas d'informations personnelles.",
    licence: 'Lire la licence',
    cancel: 'Annuler',
    agree: "J'accepte",
  },
)

const Ctx = createContext<() => Promise<boolean>>(async () => true)

/** `const ensureTerms = useTerms(); if (!(await ensureTerms())) return` before any generation. */
export const useTerms = () => useContext(Ctx)

function accepted() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function TermsProvider({ children }: { children: ReactNode }) {
  const t = useT(S)
  const dialog = useRef<HTMLDialogElement>(null)
  const resolve = useRef<(ok: boolean) => void>(null)
  const session = useRef(false)

  const ensure = useCallback(() => {
    if (session.current || accepted()) return Promise.resolve(true)
    dialog.current?.showModal()
    return new Promise<boolean>((r) => (resolve.current = r))
  }, [])

  const close = (ok: boolean) => {
    if (ok) {
      session.current = true
      try {
        localStorage.setItem(KEY, '1')
      } catch {
        /* accepted for this visit only */
      }
    }
    dialog.current?.close()
    resolve.current?.(ok)
    resolve.current = null
  }

  return (
    <Ctx.Provider value={ensure}>
      {children}
      <dialog
        ref={dialog}
        onCancel={() => close(false)}
        aria-labelledby="terms-title"
        className="m-auto w-[min(34rem,calc(100%-2rem))] rounded-card border border-border bg-surface p-0 text-text shadow-lift backdrop:bg-black/50"
      >
        <div className="stripes h-1.5" aria-hidden="true" />
        <div className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-field bg-warn-soft text-warn">
              <ShieldAlert className="size-5" aria-hidden="true" />
            </span>
            <h2 id="terms-title" className="text-lg font-bold">
              {t.title}
            </h2>
          </div>
          <p className="text-sm text-text-2">{t.intro}</p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-text-2 marker:text-accent">
            {[t.t1, t.t2, t.t3, t.t4, t.t5, t.t6].map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <a href={LINKS.licence} target="_blank" rel="noreferrer" className="inline-block text-sm text-accent underline underline-offset-4">
            {t.licence}
          </a>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => close(false)} className="h-11 rounded-field border border-border px-5 text-sm font-semibold hover:border-border-strong">
              {t.cancel}
            </button>
            <button type="button" onClick={() => close(true)} className="h-11 rounded-field bg-accent px-5 text-sm font-semibold text-accent-fg">
              {t.agree}
            </button>
          </div>
        </div>
      </dialog>
    </Ctx.Provider>
  )
}
