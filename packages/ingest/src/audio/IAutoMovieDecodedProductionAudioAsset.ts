import type { IAutoMovieProductionAudioProcessing } from "./IAutoMovieProductionAudioProcessing";
import type { IAutoMovieProductionWaveSourceFormat } from "./IAutoMovieProductionWaveSourceFormat";

/**
 * One decoded WAVE source: its declared facts, the processing applied, and mono samples available to a caller's mixer.
 *
 * The `source*` facts and `durationSeconds` describe the file before downmix and resampling, because a render plan records them as the asset's identity; only `samples` and `processing` describe the output. Reporting the output as the source would let a resampled asset claim the plan's rate and hide a duration disagreement.
 *
 * @evidence contracts/development/design.md#principled-representation Source envelope facts, processing lineage and sample storage remain separate so consumers can compare declared source/output relationships. The Float32Array carries no rate metadata and this record cannot independently prove that its samples were generated at the declared rate.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Source facts, processing and samples are three named parts of one decoder result instead of separate return paths, and the render package reuses the two nested types as its wave identity.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The decoder fills repeated source fields and `sourceFormat` from the same parsed values; this structural type neither correlates independently supplied records nor authenticates mutable sample bytes.
 * @evidence contracts/development/common.md#meaningful-documentation The comments state which fields describe the file and which the output, the units of rate and duration, and that samples are finite mono values at the requested rate.
 */
export interface IAutoMovieDecodedProductionAudioAsset {
  /** Source rate in samples per second, before resampling. */
  sourceSampleRate: number;

  /** Source channel count, 1 or 2, before the mono downmix. */
  sourceChannels: number;

  /** Number of complete sample frames in the source `data` chunk. */
  sourceFrames: number;

  /** Source runtime in seconds, `sourceFrames / sourceSampleRate`. */
  durationSeconds: number;

  /** The file's own format declaration as parsed. */
  sourceFormat: IAutoMovieProductionWaveSourceFormat;

  /** The downmix and resampling applied to produce `samples`. */
  processing: IAutoMovieProductionAudioProcessing;

  /** Finite mono samples in [-1, 1] for PCM sources at `processing.outputSampleRate`; a new buffer the caller owns. */
  samples: Float32Array;
}
