/**
 * The deterministic conversion `decodeProductionAudioAsset` applied to turn a
 * WAVE source into mono mixer input, recorded so a render plan can check it
 * against the source format it claims.
 *
 * @evidence contracts/common.md#principled-implementation The lineage records exactly the two operations the decoder performs, a fixed-coefficient downmix and a rate change, so a plan reproduces the conversion from `kind`, `matrix` and `outputSampleRate` without trusting the samples.
 * @evidence contracts/common.md#clear-and-simple-design One flat record names the stage combination and its parameters; the render package's wave identity validator reads these four fields and nothing else.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts `outputChannels` is the literal `1` and `kind` a closed union, so the type admits no layout or stage the decoder does not produce instead of widening for presumed formats.
 * @evidence contracts/common.md#meaningful-documentation The comments give the stage order, the output channel and rate meaning, and the row-by-column orientation and only values of the downmix matrix.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface is a type with no runtime code; the conversion it describes runs in `decodeProductionAudioAsset`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The lineage record is written once per decode and read by plan validation, with no computation of its own to reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record holds a one-row matrix of at most two numbers and owns no handle or task.
 * @author Samchon
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

  /** Output rate in samples per second, the rate the caller requested. */
  outputSampleRate: number;

  /**
   * Downmix coefficients with one row per output channel and one column per
   * source channel: `[[1]]` for mono and `[[0.5, 0.5]]` for stereo.
   */
  matrix: readonly (readonly number[])[];
}
