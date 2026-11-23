import type { IAutoMovieProductionAudioProcessing } from "./IAutoMovieProductionAudioProcessing";
import type { IAutoMovieProductionWaveSourceFormat } from "./IAutoMovieProductionWaveSourceFormat";

/**
 * One decoded WAVE source: its declared facts, the processing applied, and mono
 * samples available to a caller's mixer.
 *
 * The `source*` facts and `durationSeconds` describe the file before downmix
 * and resampling, because a render plan records them as the asset's identity;
 * only `samples` and `processing` describe the output. Reporting the output as
 * the source would let a resampled asset claim the plan's rate and hide a
 * duration disagreement.
 */
export interface IAutoMovieDecodedProductionAudioAsset {
  /**
   * Positive integer source rate in samples per second, admitted by the WAVE
   * decoder before resampling.
   */
  sourceSampleRate: number;

  /** Source channel count, 1 or 2, before the mono downmix. */
  sourceChannels: number;

  /**
   * Positive number of complete sample frames in the source `data` chunk; empty
   * data is refused by the decoder.
   */
  sourceFrames: number;

  /** Source runtime in seconds, `sourceFrames / sourceSampleRate`. */
  durationSeconds: number;

  /** The file's own format declaration as parsed. */
  sourceFormat: IAutoMovieProductionWaveSourceFormat;

  /** The downmix and resampling applied to produce `samples`. */
  processing: IAutoMovieProductionAudioProcessing;

  /**
   * Mono samples at processing.outputSampleRate in a new mutable buffer the
   * caller owns. PCM values lie in [-1, 1); float input is only checked finite
   * before conversion. Resampling rounds the output length and can yield an
   * empty buffer for a short source and low rate.
   */
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
   */
  export interface IProps {
    /**
     * Diagnostic label used verbatim in refusal messages; no file is opened and
     * no path validation is performed.
     */
    path: string;

    /** Complete RIFF/WAVE file, borrowed unchanged for the synchronous decode. */
    bytes: Uint8Array;

    /**
     * Positive safe-integer output samples per second, validated by the
     * decoder; no default or upper product budget.
     */
    sampleRate: number;
  }
}
