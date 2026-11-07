import { cn } from '@/lib/cn'

/** The balafon from FasoSpeechCorpora, its keys tracing a spoken waveform, with its two mallets. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="12 34 232 186" aria-hidden="true" className={cn('shrink-0', className)}>
      <path className="fill-accent" d="M30.5,126.37 L46.5,123.83 L56.46,86.67 L40.46,89.2 Z" />
      <path className="fill-accent" d="M50,123.28 L66,120.74 L78.69,73.38 L62.69,75.91 Z" />
      <path className="fill-accent" d="M69.5,120.19 L85.5,117.65 L100.92,60.08 L84.92,62.62 Z" />
      <path className="fill-accent" d="M89,117.1 L105,114.56 L116.78,70.59 L100.78,73.13 Z" />
      <path className="fill-accent" d="M108.5,114.01 L124.5,111.47 L141.06,49.65 L125.06,52.19 Z" />
      <path className="fill-accent" d="M128,110.92 L144,108.38 L157.6,57.61 L141.6,60.15 Z" />
      <path className="fill-accent" d="M147.5,107.83 L163.5,105.29 L174.37,64.72 L158.37,67.26 Z" />
      <path className="fill-accent" d="M167,104.73 L183,102.2 L197.97,46.33 L181.97,48.87 Z" />
      <path className="fill-accent" d="M186.5,101.64 L202.5,99.11 L214.74,53.44 L198.74,55.98 Z" />
      <path className="fill-accent" d="M206,98.55 L222,96.02 L231.73,59.7 L215.73,62.24 Z" />
      <path className="fill-text" d="M18.5,131.27 L234,97.13 L234,106.13 L18.5,140.27 Z" />
      <path className="fill-text" d="M18.5,168.18 L234,134.05 L234,143.05 L18.5,177.18 Z" />
      <rect x="18.5" y="116.27" width="9" height="64" rx="4.5" className="fill-text" />
      <rect x="225" y="83.4" width="9" height="64" rx="4.5" className="fill-text" />
      <circle cx="46.46" cy="144.8" r="11.97" fill="#E2B45C" />
      <circle cx="78.96" cy="140.34" r="12.57" fill="#E2B45C" />
      <circle cx="111.46" cy="135.88" r="13.17" fill="#E2B45C" />
      <circle cx="143.96" cy="131.42" r="13.77" fill="#E2B45C" />
      <circle cx="176.46" cy="126.96" r="14.37" fill="#E2B45C" />
      <circle cx="208.96" cy="122.5" r="14.97" fill="#E2B45C" />
      <path className="fill-text" d="M198.11,192.2 L66.11,186.2 Q63.12,186.06 63.25,183.06 Q63.39,180.07 66.39,180.2 L198.39,186.2 Q201.38,186.34 201.25,189.34 Q201.11,192.33 198.11,192.2 Z" />
      <circle cx="66.25" cy="183.2" r="8.5" className="fill-text" />
      <path className="fill-text" d="M194.53,196.19 L68.53,208.19 Q65.55,208.47 65.26,205.48 Q64.98,202.5 67.97,202.21 L193.97,190.21 Q196.95,189.93 197.24,192.92 Q197.52,195.9 194.53,196.19 Z" />
      <circle cx="68.25" cy="205.2" r="8.5" className="fill-text" />
    </svg>
  )
}
