import { strings, useT } from '@/lib/prefs'
import { LINKS } from '@/lib/links'

const S = strings({ and: 'and evaluated on' }, { and: 'et évalués sur' })
const a = 'font-semibold text-text underline underline-offset-4 hover:text-accent'

/** "MooreSpeechCorporaV2 and evaluated on MooreSpeechBench", both linked. */
export function Datasets() {
  const t = useT(S)
  return (
    <>
      <a href={LINKS.training} target="_blank" rel="noreferrer" className={a}>
        MooreSpeechCorporaV2
      </a>{' '}
      {t.and}{' '}
      <a href={LINKS.benchmark} target="_blank" rel="noreferrer" className={a}>
        MooreSpeechBench
      </a>
    </>
  )
}
