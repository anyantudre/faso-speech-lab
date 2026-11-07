/** Decode any audio the browser can play (recording, mp3, m4a...) to mono 16-bit WAV, so the server
 * only ever reads WAV. Also returns the duration in seconds. */
export async function toWav(input: Blob, sampleRate = 16000, maxSeconds = 60): Promise<{ wav: Blob; seconds: number }> {
  const ctx = new AudioContext()
  const decoded = await ctx.decodeAudioData(await input.arrayBuffer()).finally(() => ctx.close())
  const seconds = Math.min(decoded.duration, maxSeconds)
  const off = new OfflineAudioContext(1, Math.ceil(seconds * sampleRate), sampleRate)
  const src = off.createBufferSource()
  src.buffer = decoded
  src.connect(off.destination)
  src.start()
  const pcm = (await off.startRendering()).getChannelData(0)

  const view = new DataView(new ArrayBuffer(44 + pcm.length * 2))
  const text = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)))
  text(0, 'RIFF')
  view.setUint32(4, 36 + pcm.length * 2, true)
  text(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  text(36, 'data')
  view.setUint32(40, pcm.length * 2, true)
  pcm.forEach((v, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true))
  return { wav: new Blob([view], { type: 'audio/wav' }), seconds }
}
