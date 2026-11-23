/**
 * Owned stereo Float32 channels returned by mixAutoMovieAudioPcm after clipping
 * admission. Both channels have the requested sample-frame count; peak is the
 * largest absolute stored sample over both channels in [0, 1].
 */
export interface IAutoMovieAudioMixResult {
  /** Owned left-channel normalized PCM samples, one per output frame. */
  left: Float32Array;
  /** Owned right-channel normalized PCM samples, equal in length to left. */
  right: Float32Array;
  /**
   * Largest absolute stored channel sample, finite and at most one after
   * admission.
   */
  peak: number;
}
