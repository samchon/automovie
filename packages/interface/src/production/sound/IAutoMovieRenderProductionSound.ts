import type { IAutoMovieProductionSoundPlan } from "../IAutoMovieProductionSoundPlan";

/** Sound-plan arithmetic inputs and optional adopted mono PCM generations. */
export namespace IAutoMovieRenderProductionSound {
  /**
   * Mix semantic events, authored cue trims and supplied dialogue into a fresh
   * stereo master.
   *
   * Buffers and plan records are read synchronously and not retained by the
   * result. Room-response refusals and invalid cue/sample-clock input throw.
   * The fresh master is peak-scaled to at most 0.95 before analysis; analysis
   * measures the mixed master, not isolated event energy.
   */
  export type IProps = {
    /**
     * Borrowed admitted 48000 Hz stereo plan. Cue source/presentation spans are
     * revalidated and mapped to half-open sample intervals; other plan
     * quantities remain typed/caller premises.
     */
    plan: IAutoMovieProductionSoundPlan;
    /**
     * Optional line-id map of nonempty finite mono PCM. Missing map or id omits
     * speech; present samples are linearly fitted to the line's film span,
     * edge-faded and mixed equally into both channels without mutating the
     * buffer.
     */
    dialogue?: ReadonlyMap<string, Float32Array<ArrayBufferLike>> | undefined;
    /**
     * Optional asset-id map of nonempty finite mono PCM at the plan sample
     * rate. Missing assets use deterministic bus stand-ins; present assets are
     * read at unit rate through the cue's source trim, with zero beyond the
     * supplied buffer or trim.
     */
    assets?: ReadonlyMap<string, Float32Array<ArrayBufferLike>> | undefined;
  };
}
