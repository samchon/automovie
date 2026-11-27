import type { IAutoMovieProductionSoundPlan } from "./IAutoMovieProductionSoundPlan";
import type { IAutoMovieLoudnessIntent } from "./IAutoMovieLoudnessIntent";

/** Sound-plan arithmetic inputs and optional adopted mono PCM generations. */
export namespace IAutoMovieRenderProductionSound {
  /**
   * Mix semantic events, authored cue trims and supplied dialogue into a fresh
   * stereo master.
   *
   * Buffers and plan records are read synchronously and not retained by the
   * result. Room-response refusals and invalid cue/sample-clock input throw.
   * Each dialogue line is levelled to the dialogue target as placed. The mix
   * has no master stage, so its samples may leave [−1, 1]; engine's
   * `masterProductionSound` masters it. Analysis measures the mix, not isolated
   * event energy.
   */
  export type IProps = {
    /**
     * Borrowed admitted 48000 Hz stereo plan. Cue source/presentation spans are
     * revalidated and mapped to half-open sample intervals; other plan
     * quantities remain typed/caller premises.
     */
    plan: IAutoMovieProductionSoundPlan;
    /**
     * Optional line-id map of nonempty finite mono PCM at the plan sample rate,
     * such as ingest's decode at 48 kHz. Missing map or id omits speech.
     * Present samples play at unit rate from the start frame's sample tick,
     * edge-faded over 240 samples, levelled to the dialogue target as that
     * dual-mono pair and mixed equally into both channels without mutating the
     * buffer; a line with more samples than its speech span holds, or that
     * needs more than ±12 dB, throws.
     */
    dialogue?: ReadonlyMap<string, Float32Array<ArrayBufferLike>> | undefined;
    /**
     * Optional asset-id map of nonempty finite mono PCM at the plan sample
     * rate. Missing assets use deterministic bus stand-ins; present assets are
     * read at unit rate through the cue's source trim, with zero beyond the
     * supplied buffer or trim.
     */
    assets?: ReadonlyMap<string, Float32Array<ArrayBufferLike>> | undefined;
    /**
     * Optional loudness targets of the production; absent, the mix uses
     * engine's `AUTOMOVIE_EBU_R128_LOUDNESS`. The mix levels dialogue to them
     * and carries them to the master stage. Non-finite values or a negative
     * tolerance throw.
     */
    loudness?: IAutoMovieLoudnessIntent | undefined;
  };
}
