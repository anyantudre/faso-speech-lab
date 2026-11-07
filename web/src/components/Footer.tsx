import { Link } from 'react-router'
import { ExternalLink } from 'lucide-react'
import { Logo } from './Logo'
import { BrandIcon } from './BrandIcon'
import { WithAuthor } from './Author'
import { LIVE, MODELS } from '@/tasks'
import { strings, usePrefs, useT } from '@/lib/prefs'
import { LINKS } from '@/lib/links'

const S = strings(
  {
    about: 'Independent, non-commercial research on speech technology for Mooré, by Wendyellé A. Alban NYANTUDRE. Work in progress.',
    tasks: 'Tasks',
    resources: 'Resources',
    terms: 'Terms and licences',
    code: 'Source code',
    training: 'MooreSpeechCorporaV2',
    bench: 'MooreSpeechBench',
    corpora: 'FasoSpeechCorpora',
    models: 'Models on Hugging Face',
    lModels: 'Models:',
    lCode: 'Code:',
    tModels: 'CC BY-NC 4.0, non-commercial research use. Access is granted on request on Hugging Face.',
    tCode: 'Apache 2.0. If you use this work, please cite the paper.',
    tAudio: 'Generated audio is synthetic and cannot be downloaded. Never clone a voice without consent. Runs are saved privately for research.',
    other: 'Other initiatives',
    commercial: 'Commercial models, use and collaborations: GO AI Corporation',
    burkimbia: 'Open community: BurkimbIA',
  },
  {
    about: "Recherche indépendante et non commerciale sur les technologies de la parole en mooré, par Wendyellé A. Alban NYANTUDRE. Travail en cours.",
    tasks: 'Tâches',
    resources: 'Ressources',
    terms: 'Conditions et licences',
    code: 'Code source',
    training: 'MooreSpeechCorporaV2',
    bench: 'MooreSpeechBench',
    corpora: 'FasoSpeechCorpora',
    models: 'Modèles sur Hugging Face',
    lModels: 'Modèles :',
    lCode: 'Code :',
    tModels: "CC BY-NC 4.0, recherche non commerciale. L'accès est accordé sur demande sur Hugging Face.",
    tCode: 'Apache 2.0. Si vous utilisez ce travail, merci de citer l’article.',
    tAudio: "L'audio généré est synthétique et ne peut pas être téléchargé. Ne clonez jamais une voix sans consentement. Les exécutions sont enregistrées en privé pour la recherche.",
    other: 'Autres initiatives',
    commercial: 'Modèles, usage commercial et collaborations : GO AI Corporation',
    burkimbia: 'Communauté ouverte : BurkimbIA',
  },
)

const out = { target: '_blank', rel: 'noreferrer' }

export function Footer() {
  const { lang } = usePrefs()
  const t = useT(S)
  const a = 'inline-flex items-center gap-1.5 text-text-2 hover:text-text'
  return (
    <footer className="mt-16 border-t border-border bg-bg-2">
      <div className="stripes h-1" aria-hidden="true" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 text-sm sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2.5 font-extrabold">
            <Logo className="h-9 w-11" />
            FasoSpeech <span className="font-medium text-text-3">Lab</span>
          </Link>
          <p className="max-w-xs text-text-2">
            <WithAuthor text={t.about} />
          </p>
        </div>
        <nav aria-label={t.tasks} className="space-y-3">
          <h2 className="font-bold">{t.tasks}</h2>
          <ul className="space-y-2">
            {[...LIVE, MODELS].map((x) => (
              <li key={x.id}>
                <Link to={x.path} className={a}>
                  {x.label[lang]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t.resources} className="space-y-3">
          <h2 className="font-bold">{t.resources}</h2>
          <ul className="space-y-2">
            <li>
              <a href={LINKS.github} {...out} className={a}>
                <BrandIcon name="github" className="size-3.5" />
                {t.code}
              </a>
            </li>
            <li>
              <a href={LINKS.training} {...out} className={a}>
                <BrandIcon name="huggingface" className="size-3.5" />
                {t.training}
              </a>
            </li>
            <li>
              <a href={LINKS.benchmark} {...out} className={a}>
                <BrandIcon name="huggingface" className="size-3.5" />
                {t.bench}
              </a>
            </li>
            <li>
              <a href={LINKS.corpora} {...out} className={a}>
                <BrandIcon name="github" className="size-3.5" />
                {t.corpora}
              </a>
            </li>
            <li>
              <Link to="/models" className={a}>
                <BrandIcon name="huggingface" className="size-3.5" />
                {t.models}
              </Link>
            </li>
          </ul>
        </nav>
        <div className="space-y-3">
          <h2 className="font-bold">{t.terms}</h2>
          <ul className="space-y-2 text-text-2">
            <li>
              <b className="font-semibold text-text">{t.lModels}</b> {t.tModels}{' '}
              <a href={LINKS.licence} {...out} className="underline underline-offset-4 hover:text-text">
                CC BY-NC 4.0
              </a>
            </li>
            <li>
              <b className="font-semibold text-text">{t.lCode}</b> {t.tCode}
            </li>
            <li>{t.tAudio}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-5 text-center text-xs text-text-3 md:flex-row md:justify-center md:gap-6">
          <span className="font-bold uppercase tracking-wider">{t.other}</span>
          <a href={LINKS.goaiHf} {...out} className="inline-flex items-center gap-1.5 hover:text-text">
            <BrandIcon name="huggingface" className="size-3.5" />
            {t.commercial}
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
          <a href={LINKS.burkimbia} {...out} className="inline-flex items-center gap-1.5 hover:text-text">
            <BrandIcon name="huggingface" className="size-3.5" />
            {t.burkimbia}
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  )
}
