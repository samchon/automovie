import type { IAutoMovieAcousticResponseProfile } from "../IAutoMovieAcousticResponseProfile";
import type { IAutoMovieCompiledShotSource } from "../IAutoMovieCompiledShotSource";
import type { IAutoMovieFilmTimeline } from "../IAutoMovieFilmTimeline";
import type { IAutoMovieShotContract } from "../IAutoMovieShotContract";
import type { IAutoMovieSoundPropagationProfile } from "../IAutoMovieSoundPropagationProfile";

/**
 * Compiled edit and shot evidence used to derive a finished-film sound plan.
 */
export namespace IAutoMovieDeriveProductionSoundPlan {
  /**
   * Lower semantic shot events and authored cues/dialogue onto one finished-film sound clock.
   *
   * All inputs are borrowed for synchronous planning. Profiles and track records are copied into the returned plan, but frameRate retains the timeline's reference. acousticProfile is recorded as provenance; this function does not derive per-event room-response receipts.
   *
   * @evidence contracts/development/design.md#principled-representation Sample times are shot-local seconds rounded with Math.round(time * timeline.fps) to source frames, then translated through [sourceInFrame, sourceOutFrame) trims into film frames. The output uses 48000 Hz stereo metadata.
   * @evidence contracts/development/design.md#minimal-and-owned-surface deriveProductionSoundPlan consumes contracts for semantic event subjects, compiled scenes for spatial source/listener data and normalized audio/caption tracks for cue/dialogue placement.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing shot records, camera, sampled event declarations or all spatial sources throw. Unresolved members of an otherwise resolved subject group are skipped; the result does not certify each declared subject resolved.
   * @evidence contracts/development/common.md#meaningful-documentation Compiled edit and shot evidence used to derive a finished-film sound plan. Sample times are shot-local seconds rounded with Math.round(time * timeline.fps) to source frames, then translated through [sourceInFrame, sourceOutFrame) trims into film frames. The output uses 48000 Hz stereo metadata.
   */
  export type IProps = {
    /**
     * Borrowed normalized film timeline with admitted fps/frameRate, source trims and audio/caption tracks. Each shot occurrence contributes events independently; result events sort by film frame then code-unit id.
     */
    timeline: IAutoMovieFilmTimeline;
    /**
     * Borrowed shot-id map providing each sampled event's declared kind and subjects. Every segment requires a current contract and every compiled event sample must name one of its events.
     */
    contracts: ReadonlyMap<string, IAutoMovieShotContract>;
    /**
     * Borrowed shot-id map of current source artifacts. Every segment requires its shot and active camera; object motions and formation cues are sampled at the source event time for spatial audio.
     */
    compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>;
    /**
     * Optional explicit distance/delay model. Omitted leaves propagation fields absent and uses the existing direct attenuation at mix time; supplied data is cloned into the plan and used for event arrival calculations.
     */
    propagationProfile?: IAutoMovieSoundPropagationProfile | undefined;
    /**
     * Optional room-response provenance selection, defensively copied into the plan. Omitted leaves the field absent; this planner does not itself populate event.acousticResponse.
     */
    acousticProfile?: IAutoMovieAcousticResponseProfile | undefined;
  };
}
