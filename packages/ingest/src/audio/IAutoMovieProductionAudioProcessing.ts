/**
 * The deterministic conversion `decodeProductionAudioAsset` applied to turn a WAVE source into mono mixer input, recorded so a render plan can check it against the source format it claims.
 *
 * @evidence contracts/development/design.md#principled-representation Stage kind, downmix coefficients and requested output rate let the render identity validator compare declared processing with source channels and rate; the record does not prove sample contents or specify a general resampling algorithm independently of the decoder.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One flat record names the stage combination and its parameters; the render package's wave identity validator reads these four fields and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Literal channel and stage vocabulary constrain names, but independent fields and numeric arrays do not enforce stage/rate/matrix correlation; the decoder produces those relations and the render wave-identity validator checks them.
 * @evidence contracts/development/common.md#meaningful-documentation The comments give the stage order, the output channel and rate meaning, and the row-by-column orientation and only values of the downmix matrix.
 */
export interface IAutoMovieProductionAudioProcessing {
  /** Stages applied, in source order: `copy` for mono at the target rate, `downmix` for stereo at the target rate, `resample` for mono at another rate, and `downmix-resample` for stereo at another rate. */
  kind: "copy" | "downmix" | "resample" | "downmix-resample";

  /** Mixer-facing channel count; the decoder always folds to mono. */
  outputChannels: 1;

  /** Output rate in samples per second, the rate the caller requested. */
  outputSampleRate: number;

  /** Downmix coefficients with one row per output channel and one column per source channel: `[[1]]` for mono and `[[0.5, 0.5]]` for stereo. */
  matrix: readonly (readonly number[])[];
}
