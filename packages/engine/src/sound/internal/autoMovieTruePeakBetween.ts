import { AUTOMOVIE_TRUE_PEAK_PHASES } from "../AUTOMOVIE_TRUE_PEAK_PHASES";

/**
 * The largest absolute value of the three 4× interpolants between two
 * neighbouring samples of one channel (ITU-R BS.1770-5 Annex 2).
 *
 * The window is the 24 samples `x[n − 11] … x[n + 12]`: sample `t`, for `t`
 * from 0 to 23, is read `t` strides after `samples[start]`. The interpolants
 * lie a quarter, a half and three quarters of a sample after `x[n]`. The caller
 * supplies a whole window; zeros stand for samples outside the signal.
 *
 * @param samples Samples holding the window.
 * @param start Index of `x[n − 11]`.
 * @param stride Distance between consecutive samples of the channel: 1 for a
 *   mono run, 2 for one channel of interleaved stereo.
 * @returns The largest absolute interpolant, a linear amplitude.
 */
export function autoMovieTruePeakBetween(
  samples: ArrayLike<number>,
  start: number,
  stride: number,
): number {
  // One pass over the window feeds all three phases: every sample of a film
  // runs through here, so the three accumulators share each read.
  let quarter: number = 0;
  let half: number = 0;
  let threeQuarters: number = 0;
  for (let tap: number = 0; tap < TAPS; ++tap) {
    const x: number = samples[start + tap * stride]!;
    quarter += x * QUARTER[tap]!;
    half += x * HALF[tap]!;
    threeQuarters += x * THREE_QUARTERS[tap]!;
  }
  return Math.max(Math.abs(quarter), Math.abs(half), Math.abs(threeQuarters));
}

/** The quarter-sample phase. */
const QUARTER: Float64Array = AUTOMOVIE_TRUE_PEAK_PHASES[0]!;

/** The half-sample phase. */
const HALF: Float64Array = AUTOMOVIE_TRUE_PEAK_PHASES[1]!;

/** The three-quarter-sample phase. */
const THREE_QUARTERS: Float64Array = AUTOMOVIE_TRUE_PEAK_PHASES[2]!;

/** Taps per phase. */
const TAPS: number = QUARTER.length;
