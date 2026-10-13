import type { IAutoMovieProductionAudioProcessing } from "./IAutoMovieProductionAudioProcessing";
import type { IAutoMovieProductionWaveSourceFormat } from "./IAutoMovieProductionWaveSourceFormat";

/**
 * One decoded WAVE source: its declared facts, the exact processing applied, and the mono samples the mixer plays.
 *
 * The `source*` facts and `durationSeconds` describe the file before downmix and resampling, because a render plan records them as the asset's identity; only `samples` and `processing` describe the output. Reporting the output as the source would let a resampled asset claim the plan's rate and hide a duration disagreement.
 *
 * @evidence contracts/common.md#principled-implementation The record separates the source envelope facts from the conversion lineage and the converted samples, so a consumer can verify the samples' rate and channel count from `processing` against the declared `sourceFormat`.
 * @evidence contracts/common.md#clear-and-simple-design Source facts, processing and samples are three named parts of one decoder result instead of separate return paths, and the render package reuses the two nested types as its wave identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The source fields repeat parts of `sourceFormat` for direct reading, and the decoder fills both from the same parsed values, so neither can disagree with the other.
 * @evidence contracts/common.md#meaningful-documentation The comments state which fields describe the file and which the output, the units of rate and duration, and that samples are finite mono values at the requested rate.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface is a type with no runtime code; decoding cost belongs to `decodeProductionAudioAsset`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The decoded-asset record is produced fresh by each decode call and carries no shared computation; caching decoded assets would be the caller's choice.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type allocates nothing; the sample buffer it names is created by the decoder and owned by the caller that holds the record.
 * @author Samchon
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
