import type { IAutoMovieAcousticResponseProfile } from "./IAutoMovieAcousticResponseProfile";
import type { IAutoMovieCompiledShotSource } from "./IAutoMovieCompiledShotSource";
import type { IAutoMovieFilmTimeline } from "./IAutoMovieFilmTimeline";
import type { IAutoMovieProductionSoundPlan } from "./IAutoMovieProductionSoundPlan";
import type { IAutoMovieShotContract } from "./IAutoMovieShotContract";
import type { IAutoMovieSoundPropagationProfile } from "./IAutoMovieSoundPropagationProfile";

/** Compiled edit and shot evidence used to derive a finished-film sound plan. */
export namespace IAutoMovieDeriveProductionSoundPlan {
  /**
   * Place a recorded cue relative to a realized event on each retained use of
   * its shot.
   *
   * The frame offset moves the beginning of the source trim relative to the
   * picture event. For example, an attack two frames into the trim can align
   * with contact by starting two frames earlier. The sound plan uses the
   * picture frame before applying any optional procedural sound propagation.
   *
   * @see https://www.oscars.org/sites/oscars/files/complete_sound_and_music_activities_guide.pdf
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
   * Lower semantic shot events and authored cues/dialogue onto one
   * finished-film sound clock.
   *
   * All inputs are borrowed for synchronous planning. Profiles and track
   * records are copied into the returned plan, but frameRate retains the
   * timeline's reference. acousticProfile is recorded as provenance; this
   * function does not derive per-event room-response receipts.
   */
  export type IProps = {
    /**
     * Borrowed normalized film timeline with admitted fps/frameRate, source
     * trims and audio/caption tracks. Each shot occurrence contributes events
     * independently; result events sort by film frame then code-unit id.
     */
    timeline: IAutoMovieFilmTimeline;
    /**
     * Borrowed shot-id map providing each sampled event's declared kind and
     * subjects. Every segment requires a current contract and every compiled
     * event sample must name one of its events.
     */
    contracts: ReadonlyMap<string, IAutoMovieShotContract>;
    /**
     * Borrowed shot-id map of current source artifacts. Every segment requires
     * its shot and active camera; object motions and formation cues are sampled
     * at the source event time for spatial audio.
     */
    compiled: ReadonlyMap<string, IAutoMovieCompiledShotSource>;
    /**
     * Optional explicit distance/delay model. Omitted leaves propagation fields
     * absent and uses the existing direct attenuation at mix time; supplied
     * data is cloned into the plan and used for event arrival calculations.
     */
    propagationProfile?: IAutoMovieSoundPropagationProfile | undefined;
    /**
     * Optional room-response provenance selection, defensively copied into the
     * plan. Omitted leaves the field absent; this planner does not itself
     * populate event.acousticResponse.
     */
    acousticProfile?: IAutoMovieAcousticResponseProfile | undefined;
    /**
     * Optional adopted cues synchronized to picture events. Each authored cue
     * contributes one mix cue per retained occurrence, in film-frame order.
     * Known events removed from the cut contribute no cue. Each resulting span
     * must fit the film, and may extend across shot boundaries. Cues layer over
     * the existing semantic event score and follow fixed-position cues. Callers
     * computing an aggregate input fingerprint include these cues and their
     * adopted asset identities in it.
     */
    eventCues?: readonly IEventCue[] | undefined;

    /**
     * Adopted audio asset identities available to event cues. Every authored
     * event cue must reference a member, including cues trimmed out of the
     * film. With event cues present, omission supplies an empty registry.
     * Decoded PCM is supplied separately through renderProductionSound's assets
     * input.
     */
    eventCueAssets?: ReadonlySet<string> | undefined;

    /**
     * Optional score attenuation policy, validated and copied into the plan.
     * Callers include it in any aggregate mix input fingerprint they compute.
     */
    scoreDucking?: IAutoMovieProductionSoundPlan["scoreDucking"];

    /**
     * Optional map from a caption id to the sample count of its adopted speech
     * at the plan's 48 kHz rate, `round(sourceSamples × 48000 /
     * sourceSampleRate)` from the line's admitted receipt.
     *
     * A caption with an entry becomes a dialogue line over its speech span. Its
     * caption must end on or after the speech end frame and is refused, naming
     * both frames, when it ends earlier; a speech span past the film's last
     * frame is refused, naming the line. A caption without an entry carries no
     * speech and keeps its caption window.
     */
    speechSamples?: ReadonlyMap<string, number> | undefined;
  };
}
