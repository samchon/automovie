import type { IAutoMovieProductionSoundAnalysis } from "@automovie/interface";

/**
 * Renderer-neutral interleaved stereo PCM and its deterministic evidence.
 *
 * @evidence requirements/sound/validation-and-delivery.md#sound-numeric-verification Couples the final samples to measurements computed from those exact bytes.
 * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Exposes the mixed PCM and its numeric verification as one result.
 */
export interface IAutoMovieRenderedProductionSound {
  /**
   * Fixed 48 kHz stereo samples in LRLR order.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-numeric-verification Provides the exact final samples on which verification is calculated.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Carries the audible result whose numeric facts are reviewed.
   */
  pcm: Float32Array;
  /**
   * Analysis calculated from these exact post-limiter samples.
   *
   * @evidence requirements/sound/validation-and-delivery.md#sound-numeric-verification Reports runtime, peak, silence, clipping, and alignment from final PCM.
   * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Carries the computed evidence beside the audible result.
   */
  analysis: IAutoMovieProductionSoundAnalysis;
}
