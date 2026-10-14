import { IAutoMovieProductionSoundAnalysis } from "@automovie/interface";

/**
 * Fresh stereo master samples paired with analysis of that post-limiter generation.
 *
 * @evidence contracts/common.md#principled-implementation renderProductionSound accumulates events, cues and supplied dialogue into Float32 stereo, refuses non-finite samples, limits the master peak to 0.95 and analyzes the resulting samples.
 * @evidence contracts/common.md#clear-and-simple-design PCM and its scalar analysis travel together without codec or host resources; room response and propagation are consumed as explicit event receipts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing cue assets use an audible procedural bus stand-in and missing dialogue is omitted; mixed-master peak alignment is not proof that an individual event contributed energy.
 * @evidence contracts/common.md#meaningful-documentation Identifies LRLR sample layout, the plan's fixed 48kHz premise and post-limiter analysis; callers mutating pcm must discard or recompute the paired analysis.
 * @evidence contracts/performance.md#efficient-algorithms N stereo frames retain 2N Float32 values; analysis allocates additional O(N) loudness/filter storage and event windows, while room-response events also allocate film-length dry buffers.
 * @evidence contracts/performance.md#reuse-equivalent-work Analysis consumes the just-completed master rather than remixing it; supplied audio generations are read by identity maps, with no completed mix cache across changed plans or samples.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the master and analysis; temporary dry, response, resample and filter arrays leave scope after the call, with length-driven storage and no application cap beyond allocation capacity.
 * @author Samchon
 */
export interface IAutoMovieRenderedProductionSound {
  /** Fixed 48 kHz stereo samples in LRLR order. */
  pcm: Float32Array;

  /** Analysis calculated from these exact post-limiter samples. */
  analysis: IAutoMovieProductionSoundAnalysis;
}
