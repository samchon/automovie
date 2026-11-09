import { IAutoMovieProductionSoundAnalysis } from "@automovie/interface";

/**
 * Fresh stereo master samples paired with analysis of that post-limiter generation.
 *
 * @evidence contracts/development/design.md#principled-representation renderProductionSound accumulates events, cues and supplied dialogue into Float32 stereo, refuses non-finite samples, limits the master peak to 0.95 and analyzes the resulting samples.
 * @evidence contracts/development/design.md#minimal-and-owned-surface PCM and its scalar analysis travel together without codec or host resources; room response and propagation are consumed as explicit event receipts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing cue assets use an audible procedural bus stand-in and missing dialogue is omitted; mixed-master peak alignment is not proof that an individual event contributed energy.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies LRLR sample layout, the plan's fixed 48kHz premise and post-limiter analysis; callers mutating pcm must discard or recompute the paired analysis.
 */
export interface IAutoMovieRenderedProductionSound {
  /** Fixed 48 kHz stereo samples in LRLR order. */
  pcm: Float32Array;

  /** Analysis calculated from these exact post-limiter samples. */
  analysis: IAutoMovieProductionSoundAnalysis;
}
