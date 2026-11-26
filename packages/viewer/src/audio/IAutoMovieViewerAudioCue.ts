/**
 * One placed audio source excerpt on the film clock. A film's master comes only
 * from engine's `renderProductionSound`; to hear what the delivery encodes,
 * play the film's mixed soundtrack as one cue at second 0 and unit gain.
 */
export interface IAutoMovieViewerAudioCue {
  /** Source id. */
  asset: string;

  /** Onset, film seconds; nonnegative. */
  seconds: number;

  /** Linear gain; nonnegative. */
  gain: number;

  /** Equal-power pan in [-1, 1]; 0 by default. */
  pan?: number;

  /** Source offset, seconds; 0 by default. */
  offsetSeconds?: number;

  /** Duration on the film clock, seconds; the rest of the source by default. */
  durationSeconds?: number;

  /** Source seconds per film second; 1 by default. */
  rate?: number;
}
