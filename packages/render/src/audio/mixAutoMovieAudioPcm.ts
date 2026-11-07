/**
 * Sum mono audio sources into one stereo soundtrack, sample-accurately and
 * deterministically.
 *
 * Each cue reads its source from `offsetSeconds` at `rate` source samples per
 * output sample (two-tap linear interpolation), starting at output sample
 * `round(seconds * sampleRate)` and lasting `round(durationSeconds *
 * sampleRate)` samples (the rest of the source by default). It is shaped by
 * symmetric linear edge fades of `fadeSeconds` (at most half the cue) and
 * placed by equal-power pan, left `cos((pan + 1) pi / 4)` and right
 * `sin((pan + 1) pi / 4)`, times its gain and the master gain. Samples past
 * the soundtrack's end are dropped. The sum is clipping-safe by refusal: a
 * nonfinite sample or a peak above 1 throws instead of limiting, so a mix
 * never ships silently distorted. Cost is linear in audible cue samples and
 * the output length.
 *
 * @returns Both channels the caller owns, and the peak absolute amplitude.
 */
export function mixAutoMovieAudioPcm(input: {
  /** Output samples per second; a positive safe integer. */ sampleRate: number;
  /** Output length in samples; a positive safe integer. */ frames: number;
  /** Normalized mono sources by id, at the output rate. */ sources: Readonly<
    Record<string, Float32Array>
  >;
  /** The cues. */ cues: readonly mixAutoMovieAudioPcm.ICue[];
  /** Linear gain applied to every cue; 1 by default. */ master?: number;
  /** Edge fade length, seconds; 0.004 by default. */ fadeSeconds?: number;
}): { left: Float32Array; right: Float32Array; peak: number } {
  const rate: number = input.sampleRate;
  if (
    !Number.isSafeInteger(rate) ||
    rate <= 0 ||
    !Number.isSafeInteger(input.frames) ||
    input.frames <= 0
  )
    throw new Error("Invalid audio mix rate or length");
  const master: number = input.master ?? 1;
  const fadeSeconds: number = input.fadeSeconds ?? 0.004;
  if (!(master >= 0) || !(fadeSeconds >= 0))
    throw new Error("Invalid audio mix master gain or fade");
  const left: Float32Array = new Float32Array(input.frames);
  const right: Float32Array = new Float32Array(input.frames);
  input.cues.forEach((cue: mixAutoMovieAudioPcm.ICue, index: number): void => {
    const source: Float32Array | undefined = input.sources[cue.asset];
    if (source === undefined || source.length === 0)
      throw new Error(`Audio cue ${index} names no source: ${cue.asset}`);
    const speed: number = cue.rate ?? 1;
    const offset: number = (cue.offsetSeconds ?? 0) * rate;
    const pan: number = cue.pan ?? 0;
    if (
      ![cue.seconds, cue.gain, pan, speed, offset].every(Number.isFinite) ||
      cue.seconds < 0 ||
      cue.gain < 0 ||
      Math.abs(pan) > 1 ||
      !(speed > 0) ||
      offset < 0
    )
      throw new Error(`Invalid audio cue ${index}: ${cue.asset}`);
    const available: number =
      Math.floor((source.length - 1 - offset) / speed) + 1;
    const count: number =
      cue.durationSeconds === undefined
        ? available
        : Math.round(cue.durationSeconds * rate);
    if (!(count > 0) || count > available)
      throw new Error(`Audio cue ${index} reads past its source: ${cue.asset}`);
    const start: number = Math.round(cue.seconds * rate);
    const gainLeft: number =
      Math.cos(((pan + 1) * Math.PI) / 4) * cue.gain * master;
    const gainRight: number =
      Math.sin(((pan + 1) * Math.PI) / 4) * cue.gain * master;
    const fade: number = Math.min(
      Math.round(fadeSeconds * rate),
      Math.floor(count / 2),
    );
    for (let k: number = 0; k < count && start + k < input.frames; k++) {
      const position: number = offset + k * speed;
      const lower: number = Math.floor(position);
      const fraction: number = position - lower;
      const sample: number =
        source[lower]! * (1 - fraction) +
        source[Math.min(lower + 1, source.length - 1)]! * fraction;
      if (!Number.isFinite(sample))
        throw new Error(`Nonfinite audio source sample: ${cue.asset}`);
      const edge: number =
        fade === 0 ? 1 : Math.min(1, k / fade, (count - 1 - k) / fade);
      left[start + k] = left[start + k]! + sample * edge * gainLeft;
      right[start + k] = right[start + k]! + sample * edge * gainRight;
    }
  });
  let peak: number = 0;
  for (let k: number = 0; k < input.frames; k++)
    peak = Math.max(peak, Math.abs(left[k]!), Math.abs(right[k]!));
  if (!Number.isFinite(peak) || peak > 1)
    throw new Error(`The audio mix clips at peak ${peak}`);
  return { left, right, peak };
}
/** Companion types of {@link mixAutoMovieAudioPcm}. */
export namespace mixAutoMovieAudioPcm {
  /** One placed source excerpt. */
  export interface ICue {
    /** Source id. */
    asset: string;

    /** Output onset, seconds; nonnegative. */
    seconds: number;

    /** Linear gain; nonnegative. */
    gain: number;

    /** Equal-power pan in [-1, 1]; 0 by default. */
    pan?: number;

    /** Source offset, seconds; 0 by default. */
    offsetSeconds?: number;

    /** Output duration, seconds; the rest of the source by default. */
    durationSeconds?: number;

    /** Source samples per output sample; 1 by default. */
    rate?: number;
  }
}
