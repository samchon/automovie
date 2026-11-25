import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Timed pool, aquatic team and small-craft performances. Water is a world
 * reference plane. Named supports and tools come from the performance.
 */
export namespace IAutoMovieMotionHumanAquatic {
  /**
   * Aquatic sequence selected by the caller. The two race kinds include a start
   * and turn, the two sailing kinds distinguish completion and abort,
   * `waterExit` stands a swimmer up in the shallows onto the ground, `distress`
   * is the instinctive drowning response, `rescueTow` and `towed` are a rescuer
   * and the victim it tows, `edgeExit` climbs out over a pool edge, `liftOut`
   * and `liftedOut` are a rescuer on the deck and the victim it lifts out by
   * the wrists, and `finSwim`, `duckDive` and `snorkel` swim with fins under or
   * at the surface.
   */
  export type Kind =
    | "crawlStartTurn"
    | "breaststrokeStartTurn"
    | "springboardDive"
    | "waterPolo"
    | "artisticSwim"
    | "doubleScull"
    | "canoeStroke"
    | "kayakStroke"
    | "sailTack"
    | "sailAbort"
    | "waterExit"
    | "distress"
    | "rescueTow"
    | "towed"
    | "edgeExit"
    | "liftOut"
    | "liftedOut"
    | "finSwim"
    | "duckDive"
    | "snorkel";

  /**
   * Seat of a rower in a two-person racing shell. The bow seat is nearest the
   * bow, and the stroke seat sets the rhythm from the stern.
   */
  export type Station = "bow" | "stroke";

  /**
   * The performer's part in a team or crew. Water polo uses attack, defend and
   * keeper; artistic swimming uses figure, base and flyer; sailing uses helm
   * and crew.
   */
  export type Role =
    | "attack"
    | "defend"
    | "keeper"
    | "figure"
    | "base"
    | "flyer"
    | "helm"
    | "crew";

  /**
   * Authored staging inputs. The aquatic law admits the selected combination
   * and resolves named supports and participants on the film clock.
   */
  export interface IParams {
    /** The sequence. */
    kind: Kind;

    /** The world height of the water surface in metres; zero when omitted. */
    water?: number;

    /**
     * Boat subject id for a craft, the fixed end-wall subject with a finite
     * level edge facing across the swimmer's lane, or the pool edge an exit or
     * a lift-out is made over.
     */
    support?: string;

    /** Paddle or water polo ball subject id. */
    prop?: string;

    /**
     * End wall distance ahead of the entry, in metres, when no wall prop is
     * supplied. The race default is 6.
     */
    wall?: number;

    /**
     * World point in metres through which a held ball should pass after
     * release.
     */
    at?: IAutoMovieVector3;

    /**
     * Working side for single-blade canoe and water polo, the support hand of
     * an artistic base, or the initial side of a dinghy.
     */
    side?: AutoMovieHumanSide;

    /**
     * Start offset as a fraction of a stroke or figure for crew contrast, in
     * [0, 1].
     */
    phase?: number;

    /** Bow or stroke station on an articulated racing shell for double scull. */
    station?: Station;

    /** Polo attack or defense, artistic figure role, or dinghy crew role. */
    role?: Role;

    /**
     * Seconds of a distress before submersion (20 to 60, 30 when absent), or of
     * a fin swim or snorkel (4 when absent).
     */
    duration?: number;

    /**
     * The victim a rescuer tows or lifts out, or the rescuer a towed victim
     * holds on to.
     */
    partner?: string;

    /** Metres below the surface a duck dive reaches before it ascends. */
    depth?: number;

    /**
     * Two distinct, previously composed base swimmers supplying the flyer's
     * left and right foot supports.
     */
    bases?: readonly [string, string];

    /**
     * Optional prop-local foot reference for a seated stroke or initial dinghy
     * stance.
     */
    footRest?: IAutoMovieVector3;

    /**
     * Named support affordance at the left hand; can track a moving oar, tiller
     * or sheet.
     */
    leftGrip?: string;

    /**
     * Named support affordance at the right hand; can track a moving oar,
     * tiller or sheet.
     */
    rightGrip?: string;

    /**
     * Optional turning articulation of the dinghy boom, with signed
     * port/starboard travel.
     */
    boom?: string;

    /**
     * Optional turning articulation of the dinghy rudder, with signed helm
     * travel.
     */
    rudder?: string;
  }
}
