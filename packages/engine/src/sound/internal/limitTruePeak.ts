import { AUTOMOVIE_TRUE_PEAK_PHASES } from "../constants/AUTOMOVIE_TRUE_PEAK_PHASES";
import { truePeakBetween } from "./truePeakBetween";

/*
 * Hold the true peak of an interleaved stereo master at or below a ceiling with
 * a deterministic look-ahead limiter, in place.
 *
 * Each sample frame's peak is the largest absolute value over both channels of
 * the sample and the three 4× interpolants between it and the next (BS.1770-5
 * Annex 2, `AUTOMOVIE_TRUE_PEAK_PHASES`), and its required gain is the ceiling
 * over that peak, at most 1. The applied gain is the required gain held at its
 * minimum over the next `lookAheadSeconds`, released toward 1 with time
 * constant `releaseSeconds`, then averaged over the look-ahead. The average of
 * held values at every frame is at most that frame's required gain, so the
 * attack is a straight ramp that reaches each peak's gain by the peak.
 *
 * Interpolants read twelve samples on each side, so a gain that changes within
 * that window can leave an interpolant slightly over the ceiling, and Float32
 * storage rounds each product. The limiter therefore aims 2^−16 (0.00013 dB)
 * under the ceiling, re-measures its output, and limits again where a peak
 * remains over; it throws when four passes leave one.
 * Parameter props: The master, its rate, the ceiling and the limiter lengths.
 * Returns: The smallest gain any pass applied to a frame, in dB; 0 when no
 * frame needed limiting.
 */
export function limitTruePeak(props: {
  /*
   * Interleaved stereo samples, changed in place.
   */
  pcm: Float32Array;

  /*
   * Sample rate in Hz.
   */
  sampleRate: number;

  /*
   * Largest true peak the output may reach, in dBTP.
   */
  ceilingDbtp: number;

  /*
   * Look-ahead and attack length, in seconds.
   */
  lookAheadSeconds: number;

  /*
   * Release time constant, in seconds.
   */
  releaseSeconds: number;
}): number {
  const { pcm }: typeof props = props;
  if (
    props.lookAheadSeconds < 0 ||
    props.releaseSeconds <= 0 ||
    pcm.length % 2 !== 0
  )
    throw new Error(
      `A true-peak limiter needs a finite ceiling, a nonnegative look-ahead, a positive release and whole stereo frames, not ${props.ceilingDbtp} dBTP, ${props.lookAheadSeconds} s, ${props.releaseSeconds} s and ${pcm.length} samples.`,
    );
  const ceiling: number = 10 ** (props.ceilingDbtp / 20);
  const aim: number = ceiling * (1 - 2 ** -16);
  const lookAhead: number = Math.round(
    props.lookAheadSeconds * props.sampleRate,
  );
  const release: number =
    1 - Math.exp(-1 / (props.releaseSeconds * props.sampleRate));
  const frames: number = pcm.length / 2;

  // One array is reused for every pass: first each frame's peak, then its
  // required gain.
  const required: Float32Array = new Float32Array(frames);
  const work: Float32Array = new Float32Array(frames + lookAhead);
  let deepest: number = 1;
  for (let pass: number = 0; ; ++pass) {
    if (framePeaks(pcm, required) <= ceiling) break;
    if (pass === 4)
      throw new Error(
        `The true-peak limiter left a peak over its ${props.ceilingDbtp} dBTP ceiling after four passes.`,
      );
    for (let frame: number = 0; frame < frames; ++frame)
      required[frame] = Math.min(1, aim / required[frame]!);
    deepest = Math.min(
      deepest,
      applyGain(pcm, required, work, lookAhead, release),
    );
  }
  return 20 * Math.log10(deepest);
}

/*
 * Taps per interpolator phase.
 */
const TAPS: number = AUTOMOVIE_TRUE_PEAK_PHASES[0]!.length;

/*
 * Write each frame's peak over both channels, the sample and the interpolants
 * toward the next frame, into `peaks`, and return the largest.
 *
 * The interpolator window of frame `n` is frames `n − 11` to `n + 12`; near
 * either end of the master the window is copied with zeros outside it.
 */
const framePeaks: (pcm: Float32Array, peaks: Float32Array) => number = (
  pcm: Float32Array,
  peaks: Float32Array,
): number => {
  const frames: number = peaks.length;
  const edge: Float64Array = new Float64Array(TAPS);
  let largest: number = 0;
  for (let frame: number = 0; frame < frames; ++frame) {
    let peak: number = Math.max(
      Math.abs(pcm[frame * 2]!),
      Math.abs(pcm[frame * 2 + 1]!),
    );
    const first: number = frame - (TAPS / 2 - 1);
    for (let channel: number = 0; channel < 2; ++channel) {
      if (first >= 0 && first + TAPS <= frames)
        peak = Math.max(
          peak,
          truePeakBetween(pcm, first * 2 + channel, 2),
        );
      else {
        for (let tap: number = 0; tap < TAPS; ++tap) {
          const at: number = first + tap;
          edge[tap] = at >= 0 && at < frames ? pcm[at * 2 + channel]! : 0;
        }
        peak = Math.max(peak, truePeakBetween(edge, 0, 1));
      }
    }
    peaks[frame] = peak;
    largest = Math.max(largest, peak);
  }
  return largest;
};

/*
 * Turn per-frame required gains into the applied gain and multiply the master
 * by it; return the smallest gain applied.
 *
 * `work[k + lookAhead]` holds the gain for virtual frame `k` from `−lookAhead`
 * to `frames − 1`, frames outside the master requiring 1. Hold: the minimum
 * required gain over frames `k` to `k + lookAhead`, a sliding minimum with a
 * monotone deque in linear time. Release: the held gain may rise toward 1 by
 * the factor `release` per frame, and never above the hold. Attack: frame `m`
 * gets the mean of the released gains of frames `m − lookAhead` to `m`. Every
 * term of that mean is at most the required gain of frame `m`, because `m` lies
 * inside each term's hold window.
 */
const applyGain: (
  pcm: Float32Array,
  required: Float32Array,
  work: Float32Array,
  lookAhead: number,
  release: number,
) => number = (
  pcm: Float32Array,
  required: Float32Array,
  work: Float32Array,
  lookAhead: number,
  release: number,
): number => {
  const frames: number = required.length;
  const value: (index: number) => number = (index: number): number =>
    index >= 0 && index < frames ? required[index]! : 1;

  // Hold, for virtual frames −lookAhead … frames − 1.
  const deque: Int32Array = new Int32Array(lookAhead + 2);
  let head: number = 0;
  let size: number = 0;
  for (let index: number = -lookAhead; index < frames + lookAhead; ++index) {
    const x: number = value(index);
    while (size > 0 && value(deque[(head + size - 1) % deque.length]!) >= x)
      --size;
    deque[(head + size) % deque.length] = index;
    ++size;
    const k: number = index - lookAhead;
    if (k < -lookAhead) continue;
    while (deque[head]! < k) {
      head = (head + 1) % deque.length;
      --size;
    }
    work[k + lookAhead] = value(deque[head]!);
  }

  // Release.
  let released: number = 1;
  for (let index: number = 0; index < work.length; ++index) {
    released = Math.min(work[index]!, released + (1 - released) * release);
    work[index] = released;
  }

  // Attack, and the gain applied.
  let sum: number = 0;
  for (let index: number = 0; index < lookAhead; ++index) sum += work[index]!;
  let smallest: number = 1;
  for (let frame: number = 0; frame < frames; ++frame) {
    sum += work[frame + lookAhead]!;
    const gain: number = sum / (lookAhead + 1);
    sum -= work[frame]!;
    if (gain < 1) {
      pcm[frame * 2] = Math.fround(pcm[frame * 2]! * gain);
      pcm[frame * 2 + 1] = Math.fround(pcm[frame * 2 + 1]! * gain);
      smallest = Math.min(smallest, gain);
    }
  }
  return smallest;
};
