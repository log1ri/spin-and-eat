/**
 * All sound is synthesized live with Web Audio (no audio files)
 * The AudioContext is created only after the user's first tap (required by iOS Safari)
 * Everything goes through a master gain → muting works instantly even mid-song
 */
type Ctx = AudioContext

let ctx: Ctx | null = null
let master: GainNode | null = null
let noiseBuf: AudioBuffer | null = null
let enabled = true
/** Destination for sounds being created — during song() it points at the song bus so stopSong() can fade the whole song */
let out: AudioNode | null = null
let songBus: GainNode | null = null

function ac(): Ctx | null {
  if (!enabled) return null
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
      master = ctx.createGain()
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') void ctx.resume()
    if (!noiseBuf) {
      const len = Math.floor(ctx.sampleRate * 0.6)
      const b = ctx.createBuffer(1, len, ctx.sampleRate)
      const d = b.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
      noiseBuf = b
    }
    return ctx
  } catch {
    return null
  }
}

export function noise(type: BiquadFilterType, freq: number, vol: number, dur: number, when = 0) {
  const c = ac()
  if (!c || !master || !noiseBuf) return
  try {
    const t = c.currentTime + when
    const s = c.createBufferSource()
    s.buffer = noiseBuf
    const f = c.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    const g = c.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    s.connect(f).connect(g).connect(out ?? master)
    s.start(t)
    s.stop(t + dur + 0.02)
  } catch {
    /* ignore */
  }
}

export function tone(freq: number, type: OscillatorType, vol: number, dur: number, when = 0, lp = 6000) {
  const c = ac()
  if (!c || !master) return
  try {
    const t = c.currentTime + when
    const o = c.createOscillator()
    const g = c.createGain()
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = lp
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(f).connect(g).connect(out ?? master)
    o.start(t)
    o.stop(t + dur + 0.05)
  } catch {
    /* ignore */
  }
}

/** Flap — flipping a cover */
export const flick = () => noise('bandpass', 1400, 0.06, 0.06)
/** Whoosh — record sliding in/out of the sleeve */
export const slide = (freq = 500, vol = 0.07) => noise('bandpass', freq, vol, 0.35)
/** Needle drop */
export function needleDrop() {
  tone(90, 'sine', 0.25, 0.18)
  noise('lowpass', 900, 0.12, 0.08)
}
/** Tick — needle crossing a track ring */
export const tick = () => tone(2200, 'sine', 0.03, 0.03)

interface Voice {
  type?: OscillatorType
  vol: number
  dur: number
  when: number
  /** low-pass (Hz) */
  lp?: number
  /** Attack time (seconds) — short = plucked/struck, long = soft pad */
  attack?: number
  /** Vibrato rate in Hz + depth in cents — for the khaen */
  vib?: [number, number]
}

/** One note with a configurable envelope (tone() above is fixed, for sound effects) */
function voice(freq: number, v: Voice) {
  const c = ac()
  if (!c || !master) return
  try {
    const t = c.currentTime + v.when
    const atk = v.attack ?? 0.012
    const o = c.createOscillator()
    const g = c.createGain()
    const f = c.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = v.lp ?? 6000
    o.type = v.type ?? 'sine'
    o.frequency.value = freq
    if (v.vib) {
      const lfo = c.createOscillator()
      const depth = c.createGain()
      lfo.frequency.value = v.vib[0]
      depth.gain.value = freq * (Math.pow(2, v.vib[1] / 1200) - 1)
      lfo.connect(depth).connect(o.frequency)
      lfo.start(t)
      lfo.stop(t + v.dur + 0.05)
    }
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(v.vol, t + atk)
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(v.dur, atk + 0.02))
    o.connect(f).connect(g).connect(out ?? master)
    o.start(t)
    o.stop(t + v.dur + 0.05)
  } catch {
    /* ignore */
  }
}

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)
/** Play a step pattern: each slot lasts step seconds, starting at `at` · 0 = rest */
const seq = (notes: readonly number[], step: number, at: number, play: (f: number, when: number, i: number) => void) =>
  notes.forEach((n, i) => n && play(hz(n), at + i * step, i))

/** Vinyl crackle */
function crackle(secs: number, count: number) {
  for (let i = 0; i < count; i++) noise('highpass', 3000, 0.02 + Math.random() * 0.05, 0.012, Math.random() * secs)
}

/**
 * Short per-album songs (3–5s) played when the needle finds a track — fully Web Audio, no files/licensing
 * Each album has its own tune to match its title
 */
const SONGS: Record<string, () => void> = {
  /** GREATEST HITS: cheerful lo-fi (the app's original song) */
  all() {
    const MEL = [67, 71, 74, 71, 72, 76, 79, 76, 74, 71, 67, 71, 72, 0, 67, 0]
    seq(MEL, 0.22, 0.25, (f, w) => voice(f, { type: 'triangle', vol: 0.11, dur: 0.32, when: w, lp: 1500 }))
    seq([43, 0, 0, 0, 48, 0, 0, 0, 50, 0, 0, 0, 43], 0.22, 0.25, (f, w) => voice(f, { vol: 0.16, dur: 0.8, when: w, lp: 800 }))
    crackle(4, 46)
  },
  /** RICE & RHYTHM: bouncy pentatonic marimba + plucked bass on the beat */
  rice() {
    const MEL = [72, 76, 79, 76, 74, 72, 69, 72, 74, 76, 79, 84, 79, 76, 72, 0]
    seq(MEL, 0.17, 0.2, (f, w) => {
      voice(f, { vol: 0.13, dur: 0.22, when: w, attack: 0.004 })
      voice(f * 4, { vol: 0.025, dur: 0.06, when: w, attack: 0.002 }) // mallet click
    })
    seq([48, 0, 55, 0, 48, 0, 55, 0, 50, 0, 57, 0, 48, 0, 0, 0], 0.17, 0.2, (f, w) => voice(f, { vol: 0.14, dur: 0.18, when: w, attack: 0.004, lp: 900 }))
    crackle(3, 30)
  },
  /** NOODLE GROOVE: 70s funk — syncopated bass + short chord stabs */
  noodle() {
    const BASS = [40, 0, 40, 52, 0, 40, 43, 45, 40, 0, 40, 52, 0, 47, 45, 43]
    for (const bar of [0, 1])
      seq(BASS, 0.13, 0.2 + bar * 16 * 0.13, (f, w) => voice(f, { type: 'sawtooth', vol: 0.22, dur: 0.12, when: w, lp: 700, attack: 0.005 }))
    const STAB = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0]
    for (const bar of [0, 1])
      STAB.forEach((on, i) => {
        if (!on) return
        for (const n of [64, 67, 71, 74]) voice(hz(n), { type: 'square', vol: 0.04, dur: 0.09, when: 0.2 + (bar * 16 + i) * 0.13, lp: 2200, attack: 0.004 })
      })
    for (let i = 0; i < 32; i += 2) noise('highpass', 7000, i % 4 === 2 ? 0.03 : 0.015, 0.04, 0.2 + i * 0.13) // hi-hat
    crackle(4.5, 30)
  },
  /** SOUP SYMPHONY: slow and warm — soft pad chords + long melody */
  soup() {
    const CHORDS = [
      [53, 57, 60, 64],
      [52, 55, 59, 62],
      [50, 53, 57, 60],
      [48, 52, 55, 59, 62],
    ]
    CHORDS.forEach((ch, i) => ch.forEach((n) => voice(hz(n), { type: 'triangle', vol: 0.045, dur: 1.3, when: 0.2 + i * 1, attack: 0.35, lp: 1400 })))
    seq([76, 0, 74, 72, 71, 0, 72, 74, 72, 0, 0, 0], 0.33, 0.2, (f, w) => voice(f, { vol: 0.12, dur: 0.6, when: w, attack: 0.06, lp: 2500 }))
    crackle(4.4, 40)
  },
  /** ISAN BEAT: khaen (drone + vibrato) + fast pentatonic lai + ching/chap cymbals + drum */
  isan() {
    const T = 0.15
    const N = 28
    for (const d of [57, 64]) voice(hz(d), { type: 'sawtooth', vol: 0.04, dur: N * T + 0.3, when: 0.2, attack: 0.15, lp: 1100, vib: [5.5, 8] })
    const MEL = [69, 72, 74, 76, 74, 72, 69, 67, 69, 72, 69, 67, 64, 67, 69, 0, 76, 79, 76, 74, 72, 74, 72, 69, 67, 69, 0, 0]
    seq(MEL, T, 0.2, (f, w) => voice(f, { type: 'sawtooth', vol: 0.085, dur: T * 1.1, when: w, attack: 0.02, lp: 1600, vib: [5.5, 10] }))
    for (let i = 0; i < N; i += 2) {
      const w = 0.2 + i * T
      if (i % 4 === 0) {
        voice(2600, { vol: 0.03, dur: 0.35, when: w, attack: 0.002 }) // ching
        voice(3900, { vol: 0.015, dur: 0.3, when: w, attack: 0.002 })
      } else noise('bandpass', 3200, 0.06, 0.05, w) // chap
      if (i % 8 === 0) voice(70, { vol: 0.22, dur: 0.18, when: w, attack: 0.004 }) // drum
    }
  },
  /** SWEET BALLAD: sweet, high music box with a long ring */
  sweet() {
    const MEL = [84, 88, 91, 88, 86, 84, 79, 81, 84, 0, 83, 86, 84, 0, 0, 0]
    seq(MEL, 0.24, 0.2, (f, w) => {
      voice(f, { vol: 0.08, dur: 1.1, when: w, attack: 0.003 })
      voice(f * 2, { vol: 0.02, dur: 0.5, when: w, attack: 0.003 })
    })
    seq([60, 0, 0, 0, 65, 0, 0, 0, 67, 0, 0, 0, 60], 0.24, 0.2, (f, w) => voice(f, { vol: 0.05, dur: 1, when: w, attack: 0.02, lp: 1200 }))
    crackle(4, 25)
  },
}

/** Song for album `key` (unknown key → the all-hits song) */
export function song(key = 'all') {
  const c = ac()
  if (!c || !master) return
  stopSong()
  songBus = c.createGain()
  songBus.connect(master)
  out = songBus
  try {
    ;(SONGS[key] ?? SONGS.all)!()
  } finally {
    out = null
  }
}

/** Stop the current song (needle lifted / album changed) — quick fade so it doesn't pop */
export function stopSong() {
  if (!songBus || !ctx) return
  const bus = songBus
  songBus = null
  try {
    bus.gain.setTargetAtTime(0, ctx.currentTime, 0.04)
    window.setTimeout(() => bus.disconnect(), 400)
  } catch {
    /* ignore */
  }
}

export function setSoundEnabled(on: boolean) {
  enabled = on
  if (master && ctx) master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.02)
}

/** Unlock audio on iOS: create/resume the context during the user's first tap */
export function installAudioUnlock() {
  const unlock = () => {
    const c = ac()
    if (!c) return
    try {
      const src = c.createBufferSource()
      src.buffer = c.createBuffer(1, 1, 22050)
      src.connect(c.destination)
      src.start(0)
    } catch {
      /* ignore */
    }
    if (c.state === 'running') {
      window.removeEventListener('pointerdown', unlock, true)
      window.removeEventListener('keydown', unlock, true)
    }
  }
  window.addEventListener('pointerdown', unlock, true)
  window.addEventListener('keydown', unlock, true)
}
