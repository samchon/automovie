/**
 * One mono excerpt placed on the output sample clock. mixAutoMovieAudioPcm
 * validates finite onset/gain/pan/rate/offset, rounds onset and explicit
 * duration to output samples, linearly interpolates source samples, and refuses
 * an empty or overlong excerpt. Content beyond the output end is dropped.
 * Defaults are pan/offset zero, rate one, and duration through the last
 * available source sample.
 */
export interface IAutoMovieAudioMixCue {
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
