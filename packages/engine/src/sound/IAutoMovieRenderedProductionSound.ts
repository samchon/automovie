import type { IAutoMovieProductionSoundAnalysis } from "@automovie/interface";

/** Renderer-neutral interleaved stereo PCM and its deterministic evidence. */
export interface IAutoMovieRenderedProductionSound {
  /** Fixed 48 kHz stereo samples in LRLR order. */
  pcm: Float32Array;
  /** Analysis calculated from these exact post-limiter samples. */
  analysis: IAutoMovieProductionSoundAnalysis;
}
