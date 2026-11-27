/**
 * The deterministic conversion `AutoMovieIngestAudio.decodeAsset` applied to turn a
 * WAVE source into mono mixer input, recorded so a render plan can check it
 * against the source format it claims.
 */
export interface IAutoMovieProductionAudioProcessing {
  /**
   * Stages applied, in source order: `copy` for mono at the target rate,
   * `downmix` for stereo at the target rate, `resample` for mono at another
   * rate, and `downmix-resample` for stereo at another rate.
   */
  kind: "copy" | "downmix" | "resample" | "downmix-resample";

  /** Mixer-facing channel count; the decoder always folds to mono. */
  outputChannels: 1;

  /**
   * Positive safe-integer output samples per second, validated by the ingest
   * decoder from the caller's request.
   */
  outputSampleRate: number;

  /**
   * Downmix coefficients with one row per output channel and one column per
   * source channel: `[[1]]` for mono and `[[0.5, 0.5]]` for stereo.
   */
  matrix: readonly (readonly number[])[];
}
