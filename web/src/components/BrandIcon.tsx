import { siGithub, siHuggingface } from 'simple-icons'

const ICONS = { github: siGithub, huggingface: siHuggingface }

export function BrandIcon({ name, className }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d={ICONS[name].path} />
    </svg>
  )
}
