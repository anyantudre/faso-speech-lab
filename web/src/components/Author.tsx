import { LINKS } from '@/lib/links'

export const AUTHOR = 'Wendyellé A. Alban NYANTUDRE'

/** Renders `text` with the author's name linked to their website. */
export function WithAuthor({ text }: { text: string }) {
  const [before, after] = text.split(AUTHOR)
  if (after === undefined) return text
  return (
    <>
      {before}
      <a href={LINKS.author} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-accent">
        {AUTHOR}
      </a>
      {after}
    </>
  )
}
