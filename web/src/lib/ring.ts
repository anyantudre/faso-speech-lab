/** Deterministic "voice signature": radial bars whose lengths come from three seeded harmonics.
 * Same id, same ring. */
function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

export function rng(seed: string) {
  let a = hash(seed)
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Bar = { deg: number; y: number; len: number }

export function ringBars(id: string, n = 44): Bar[] {
  const r = rng('ring:' + id)
  const [a1, a2, a3] = [r() * 6.28, r() * 6.28, r() * 6.28]
  const [k1, k2, k3] = [2 + Math.floor(r() * 3), 4 + Math.floor(r() * 4), 7 + Math.floor(r() * 5)]
  const [w1, w2, w3] = [0.5 + r() * 0.5, 0.25 + r() * 0.4, 0.1 + r() * 0.25]
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2
    const v = w1 * Math.sin(k1 * t + a1) + w2 * Math.sin(k2 * t + a2) + w3 * Math.sin(k3 * t + a3)
    const len = 4 + ((v / (w1 + w2 + w3) + 1) / 2) * 22
    return { deg: (360 / n) * i, y: 50 - 21 - len, len }
  })
}
