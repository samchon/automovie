import type { IAutoMovieProductionAudioProcessing } from "./IAutoMovieProductionAudioProcessing";
import type { IAutoMovieProductionWaveSourceFormat } from "./IAutoMovieProductionWaveSourceFormat";

/** One WAVE source's declared facts and the exact processing applied to it. */
export interface IAutoMovieDecodedProductionAudioAsset {
  /** Source sample clock before resampling. */
  sourceSampleRate: number;
  /** Source channel count before downmix. */
  sourceChannels: number;
  /** Complete source sample-frame count. */
  sourceFrames: number;
  /** Exact source runtime derived from frames and sample rate. */
  durationSeconds: number;
  /** Parsed immutable source-format facts. */
  sourceFormat: IAutoMovieProductionWaveSourceFormat;
  /** Deterministic processing lineage applied to the source. */
  processing: IAutoMovieProductionAudioProcessing;
  /** Finite mono samples at the requested output clock. */
  samples: Float32Array;
}
