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
  /** Positive integer source rate in samples per second, admitted by the WAVE decoder before resampling. */
  sourceSampleRate: number;

  /** Source channel count, 1 or 2, before the mono downmix. */
  sourceChannels: number;

  /** Positive number of complete sample frames in the source `data` chunk; empty data is refused by the decoder. */
  sourceFrames: number;

  /** Source runtime in seconds, `sourceFrames / sourceSampleRate`. */
  durationSeconds: number;

  /** The file's own format declaration as parsed. */
  sourceFormat: IAutoMovieProductionWaveSourceFormat;

  /** The downmix and resampling applied to produce `samples`. */
  processing: IAutoMovieProductionAudioProcessing;

  /** Mono samples at processing.outputSampleRate in a new mutable buffer the caller owns. PCM values lie in [-1, 1); float input is only checked finite before conversion. Resampling rounds the output length and can yield an empty buffer for a short source and low rate. */
  samples: Float32Array;
}

/** Input contract of the resident WAVE decoder. */
export namespace IAutoMovieDecodedProductionAudioAsset {
  /**
   * Complete resident source bytes and an explicit mono output rate.
   *
   * The ingest decoder admits RIFF/WAVE 16-bit PCM or 32-bit float, mono or
   * stereo. Invalid fields throw an asset/field diagnostic; allocation errors
   * may propagate because no product memory budget bounds the requested rate.
   *
   * @evidence contracts/development/design.md#principled-representation Input bytes remain distinct from requested output rate and diagnostic identity; the decoder admits positive safe-integer rates and WAVE consistency at runtime.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The decoder reads only these three required fields and owns neither file acquisition nor caching.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No default rate, implicit file loading or codec fallback is expressed; unsupported encodings throw.
   * @evidence contracts/development/common.md#meaningful-documentation Members state diagnostic-only path use, byte lifetime, rate units and required explicit input.
   */
  export interface IProps {
    /** Diagnostic label used verbatim in refusal messages; no file is opened and no path validation is performed. */
    path: string;

    /** Complete RIFF/WAVE file, borrowed unchanged for the synchronous decode. */
    bytes: Uint8Array;

    /** Positive safe-integer output samples per second, validated by the decoder; no default or upper product budget. */
    sampleRate: number;
  }
}
