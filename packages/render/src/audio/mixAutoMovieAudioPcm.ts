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
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Sum mono audio sources into one stereo soundtrack, sample-accurately and deterministically) and documents the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Sum mono audio sources into one stereo soundtrack, sample-accurately and deterministically) directly over its typed inputs (`input`) as nested iteration of depth 2 (forEach over input.cues; every over [cue.seconds, cue.gain, pan, speed, offs; for loop bounded by k < count && start + k < input.frames), delegating to `Number.isSafeInteger`, `Math.abs`, `Math.floor`, `Math.round`, `Math.cos`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (7 throw sites). Beyond structural 0, 1 and 2 the body uses the literals 0.004, 4, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 70 lines and 12 top-level statements that reuses `Number.isSafeInteger`, `Math.abs`, `Math.floor`, `Math.round`, `Math.cos` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 6 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (forEach over input.cues; every over [cue.seconds, cue.gain, pan, speed, offs; for loop bounded by k < count && start + k < input.frames), performed once per call with 11 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 11 allocation sites become the returned value or die with the call, so nothing grows.
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
/**
 * Companion types of {@link mixAutoMovieAudioPcm}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Companion types of ) and documents 1 documented member as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Companion types of : companion namespace of 1 member (`ICue`); units and frames named in its text: seconds. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `mixAutoMovieAudioPcm` in packages/render/src/audio/mixAutoMovieAudioPcm.ts; its surface is the 1 member listed and the text shows 4 other files naming it, mostly packages/render (2), packages/viewer (1), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
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
