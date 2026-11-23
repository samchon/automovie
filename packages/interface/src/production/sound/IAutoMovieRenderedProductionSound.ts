import type { IAutoMovieProductionSoundAnalysis } from "../IAutoMovieProductionSoundAnalysis";

/**
 * Fresh stereo master samples paired with analysis of that post-limiter generation.
 */
export interface IAutoMovieRenderedProductionSound {
  /** Fixed 48 kHz stereo samples in LRLR order. */
  pcm: Float32Array;

  /** Analysis calculated from these exact post-limiter samples. */
  analysis: IAutoMovieProductionSoundAnalysis;
}
