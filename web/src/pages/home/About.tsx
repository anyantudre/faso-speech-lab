import { ArrowRight, ArrowUpRight, FlaskConical } from 'lucide-react'
import { WithAuthor } from '@/components/Author'
import { BrandIcon } from '@/components/BrandIcon'
import { strings, useT } from '@/lib/prefs'
import { LINKS } from '@/lib/links'

const S = strings(
  {
    kicker: 'About this lab',
    title: 'Independent research, work in progress',
    body: 'Faso Speech Lab is a personal research project by Wendyellé A. Alban NYANTUDRE on speech technology for Mooré. The models are trained on openly available data, shared for non-commercial research, and still experimental. This is not a product.',
    more: 'For mature work on the languages of Burkina Faso, see these two initiatives.',
    goai: 'Production-grade models, commercial licenses, APIs and collaborations to integrate models into your products.',
    burkimbia: 'A community initiative working on the languages of Burkina Faso.',
    website: 'Website',
  },
  {
    kicker: 'À propos du labo',
    title: 'Recherche indépendante, en cours',
    body: "Faso Speech Lab est un projet de recherche personnel de Wendyellé A. Alban NYANTUDRE sur les technologies de la parole en mooré. Les modèles sont entraînés sur des données librement accessibles, partagés pour la recherche non commerciale, et encore expérimentaux. Ce n'est pas un produit.",
    more: 'Pour des travaux aboutis sur les langues du Burkina Faso, voyez ces deux initiatives.',
    goai: 'Des modèles prêts pour la production, des licences commerciales, des API et des collaborations pour intégrer des modèles à vos produits.',
    burkimbia: 'Une initiative communautaire sur les langues du Burkina Faso.',
    website: 'Site web',
  },
)

const out = { target: '_blank', rel: 'noreferrer' }
const link = 'inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-text-2 hover:text-accent'

export function About() {
  const t = useT(S)
  const orgs = [
    { name: 'GO AI Corporation', text: t.goai, links: [[t.website, LINKS.goai, null], ['Hugging Face', LINKS.goaiHf, 'huggingface']] },
    { name: 'BurkimbIA', text: t.burkimbia, links: [[t.website, LINKS.burkimbiaSite, null], ['Hugging Face', LINKS.burkimbia, 'huggingface']] },
  ] as const
  return (
    <section aria-labelledby="about-title" className="mx-auto max-w-6xl px-4 pt-16 md:pt-20">
      <div className="grid gap-px overflow-hidden rounded-card border border-border bg-border lg:grid-cols-[1.3fr_1fr_1fr]">
        <div className="bg-surface p-5 md:p-6">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-3">
            <FlaskConical className="size-4" aria-hidden="true" />
            {t.kicker}
          </p>
          <h2 id="about-title" className="mt-3 text-xl font-extrabold tracking-tight">
            {t.title}
          </h2>
          <p className="mt-2 text-text-2">
            <WithAuthor text={t.body} />
          </p>
          <p className="mt-4 flex items-start gap-2 rounded-field border border-accent/30 bg-accent-soft px-3.5 py-3 text-sm font-semibold text-accent">
            <ArrowRight className="mt-0.5 size-4 shrink-0 max-lg:rotate-90" aria-hidden="true" />
            {t.more}
          </p>
        </div>
        {orgs.map((o) => (
          <div key={o.name} className="flex flex-col bg-surface-2 p-5 shadow-[inset_0_3px_0_var(--accent)] md:p-6">
            <b className="text-lg">{o.name}</b>
            <p className="mt-1.5 text-sm text-text-2">{o.text}</p>
            <div className="mt-auto flex flex-wrap gap-x-5 pt-3">
              {o.links.map(([label, href, icon]) => (
                <a key={href} href={href} {...out} className={link}>
                  {icon && <BrandIcon name={icon} className="size-3.5" />}
                  {label}
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
