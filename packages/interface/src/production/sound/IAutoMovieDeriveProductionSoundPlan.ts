import type { IAutoMovieAcousticResponseProfile } from "../IAutoMovieAcousticResponseProfile";
import type { IAutoMovieCompiledShotSource } from "../IAutoMovieCompiledShotSource";
import type { IAutoMovieFilmTimeline } from "../IAutoMovieFilmTimeline";
import type { IAutoMovieProductionSoundPlan } from "../IAutoMovieProductionSoundPlan";
import type { IAutoMovieShotContract } from "../IAutoMovieShotContract";
import type { IAutoMovieSoundPropagationProfile } from "../IAutoMovieSoundPropagationProfile";

/**
 * Compiled edit and shot evidence used to derive a finished-film sound plan.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Compiled edit and shot evidence used to derive a finished-film sound plan. Sample times are shot-local seconds rounded with Math.round(time * timeline.fps) to source frames, then translated through [sourceInFrame, sourceOutFrame) trims into film frames. The output uses 48000 Hz stereo metadata.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing shot records, camera, sampled event declarations or all spatial sources throw. Unresolved members of an otherwise resolved subject group are skipped; the result does not certify each declared subject resolved.
 * @evidence contracts/development/design.md#principled-representation Sample times are shot-local seconds rounded with Math.round(time * timeline.fps) to source frames, then translated through [sourceInFrame, sourceOutFrame) trims into film frames. The output uses 48000 Hz stereo metadata.
 * @evidence contracts/development/design.md#minimal-and-owned-surface deriveProductionSoundPlan consumes contracts for semantic event subjects, compiled scenes for spatial source/listener data and normalized audio/caption tracks for cue/dialogue placement. Optional event cues share the source trim and resolve on the retained picture event frame.
 */
export namespace IAutoMovieDeriveProductionSoundPlan {
  /**
   * Place a recorded cue relative to a realized event on each retained use of its shot.
   *
   * The frame offset moves the beginning of the source trim relative to the
   * picture event. For example, an attack two frames into the trim can align
   * with contact by starting two frames earlier. The sound plan uses the
   * picture frame before applying any optional procedural sound propagation.
   *
   * @see https://www.oscars.org/sites/oscars/files/complete_sound_and_music_activities_guide.pdf
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the shot-local target, signed frame offset, source-relative onset, and mix clock.
   * @evidence contracts/development/design.md#principled-representation Combines the common normalized source trim and gain fields with a shot-event reference and a signed whole-frame displacement from each retained picture occurrence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Reuses fixed cue payload fields and replaces only the film start with shot, event and frame offset.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The planner checks the declared asset, source trim and film placement. Decoded PCM remains a separate mix input.
   */
  export type IEventCue = Omit<
    IAutoMovieFilmTimeline["tracks"]["audio"][number],
    "startFrame"
  > & {
    /** Shot id in the current contract and compiled-source maps. */
    shot: string;

    /** Event id declared and realized once in that shot. */
    event: string;

    /** Signed safe-integer film frames from the event to the start of the cue. */
    offsetFrames: number;
  };

  /**
   * Lower semantic shot events and authored cues/dialogue onto one finished-film sound clock.
   *
   * All inputs are borrowed for synchronous planning. Profiles and track records are copied into the returned plan, but frameRate retains the timeline's reference. acousticProfile is recorded as provenance; this function does not derive per-event room-response receipts.
   *
   * @evidence contracts/development/design.md#principled-representation Sample times are shot-local seconds rounded with Math.round(time * timeline.fps) to source frames, then translated through [sourceInFrame, sourceOutFrame) trims into film frames. The output uses 48000 Hz stereo metadata.
   * @evidence contracts/development/design.md#minimal-and-owned-surface deriveProductionSoundPlan consumes contracts for semantic event subjects, compiled scenes for spatial source/listener data and normalized audio/caption tracks for cue/dialogue placement. Optional event cues share the source trim and resolve on the retained picture event frame.
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
    /**
     * Optional adopted cues synchronized to picture events. Each authored cue
     * contributes one mix cue per retained occurrence, in film-frame order.
     * Known events removed from the cut contribute no cue. Each resulting span
     * must fit the film, and may extend across shot boundaries. Cues layer
     * over the existing semantic event score and follow fixed-position cues.
     * Callers computing an aggregate input fingerprint include these cues and
     * their adopted asset identities in it.
     */
    eventCues?: readonly IEventCue[] | undefined;

    /**
     * Adopted audio asset identities available to event cues. Every authored
     * event cue must reference a member, including cues trimmed out of the film.
     * With event cues present, omission supplies an empty registry. Decoded PCM
     * is supplied separately through renderProductionSound's assets input.
     */
    eventCueAssets?: ReadonlySet<string> | undefined;

    /**
     * Optional score attenuation policy, validated and copied into the plan.
     * Callers include it in any aggregate mix input fingerprint they compute.
     */
    scoreDucking?: IAutoMovieProductionSoundPlan["scoreDucking"];
  };
}
