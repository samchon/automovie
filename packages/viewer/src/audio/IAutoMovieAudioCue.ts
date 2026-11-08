/**
 * One placed audio source excerpt on the film clock, the same shape the
 * Render mixer (`mixAutoMovieAudioPcm`) sums, so Viewer playback and the
 * exported soundtrack read one cue list.
 */
export interface IAutoMovieAudioCue {
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
