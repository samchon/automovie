import type { IAutoMovieProductionSoundPlan } from "../IAutoMovieProductionSoundPlan";

/**
 * Sound-plan arithmetic inputs and optional adopted mono PCM generations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Sound-plan arithmetic inputs and optional adopted mono PCM generations. Plan events/cues/dialogue use film frames; rational boundaries round once to the 48000 Hz sample clock. The mixer assumes the plan's declared stereo/48000 Hz contract and validates cue trims plus supplied referenced PCM.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing cue assets intentionally select procedural bus stand-ins while missing dialogue omits that line. These are distinct fallbacks; empty/nonfinite supplied buffers throw instead of triggering them.
 * @evidence contracts/development/design.md#principled-representation Plan events/cues/dialogue use film frames; rational boundaries round once to the 48000 Hz sample clock. The mixer assumes the plan's declared stereo/48000 Hz contract and validates cue trims plus supplied referenced PCM.
 * @evidence contracts/development/design.md#minimal-and-owned-surface renderProductionSound consumes adopted decoded mono buffers through id maps and returns a fresh stereo master plus analysis; decoding, IO and asset provenance remain host responsibilities.
 */
export namespace IAutoMovieRenderProductionSound {
  /**
   * Mix semantic events, authored cue trims and supplied dialogue into a fresh stereo master.
   *
   * Buffers and plan records are read synchronously and not retained by the result. Room-response refusals and invalid cue/sample-clock input throw. The fresh master is peak-scaled to at most 0.95 before analysis; analysis measures the mixed master, not isolated event energy.
   *
   * @evidence contracts/development/design.md#principled-representation Plan events/cues/dialogue use film frames; rational boundaries round once to the 48000 Hz sample clock. The mixer assumes the plan's declared stereo/48000 Hz contract and validates cue trims plus supplied referenced PCM.
   * @evidence contracts/development/design.md#minimal-and-owned-surface renderProductionSound consumes adopted decoded mono buffers through id maps and returns a fresh stereo master plus analysis; decoding, IO and asset provenance remain host responsibilities.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing cue assets intentionally select procedural bus stand-ins while missing dialogue omits that line. These are distinct fallbacks; empty/nonfinite supplied buffers throw instead of triggering them.
   * @evidence contracts/development/common.md#meaningful-documentation Sound-plan arithmetic inputs and optional adopted mono PCM generations. Plan events/cues/dialogue use film frames; rational boundaries round once to the 48000 Hz sample clock. The mixer assumes the plan's declared stereo/48000 Hz contract and validates cue trims plus supplied referenced PCM.
   */
  export type IProps = {
    /**
     * Borrowed admitted 48000 Hz stereo plan. Cue source/presentation spans are revalidated and mapped to half-open sample intervals; other plan quantities remain typed/caller premises.
     */
    plan: IAutoMovieProductionSoundPlan;
    /**
     * Optional line-id map of nonempty finite mono PCM. Missing map or id omits speech; present samples are linearly fitted to the line's film span, edge-faded and mixed equally into both channels without mutating the buffer.
     */
    dialogue?: ReadonlyMap<string, Float32Array<ArrayBufferLike>> | undefined;
    /**
     * Optional asset-id map of nonempty finite mono PCM at the plan sample rate. Missing assets use deterministic bus stand-ins; present assets are read at unit rate through the cue's source trim, with zero beyond the supplied buffer or trim.
     */
    assets?: ReadonlyMap<string, Float32Array<ArrayBufferLike>> | undefined;
  };
}
