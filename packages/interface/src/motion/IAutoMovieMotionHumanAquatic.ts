import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

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
   * keeper. Artistic swimming uses figure, base and flyer. Sailing uses helm
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
     * Subject ID of the required support for the chosen sequence.
     *
     * A boat action names its hull. A race with a named wall uses its finite
     * level edge across the lane. A pool exit or lift names an edge with
     * water along local `+Z`. `edgeExit` uses `deckFace` when the support
     * supplies it and refuses freeboard above 0.5 m.
     */
    support?: string;

    /**
     * Subject id of the paddle, water polo ball, or worn fin used by the
     * selected sequence. Fin swimming, snorkelling and duck dives require a fin
     * with width and depth on its `blade` affordance.
     */
    prop?: string;

    /**
     * End wall distance ahead of the entry, in metres, when no wall prop is
     * supplied. The race default is 6.
     */
    wall?: number;

    /**
     * World point in metres. A water polo attack can aim its release through
     * this point. `rescueTow` and `towed` use the same point as their edge or
     * shore destination, with the tow directed along its horizontal axes.
     */
    at?: IAutoMovieVector3;

    /**
     * Working side for single-blade canoe and water polo, the support hand of
     * an artistic base, or the initial side of a dinghy.
     */
    side?: AutoMovieHumanSide;

    /**
     * Start offset as a fraction of a stroke or figure for crew contrast, in
     * [0, 1]. Defaults to 0.
     */
    phase?: number;

    /** Bow or stroke station on an articulated racing shell for double scull. */
    station?: Station;

    /**
     * The role for water polo, an artistic figure, or a dinghy. The respective
     * defaults are `attack`, `figure`, and `helm`.
     */
    role?: Role;

    /**
     * Time in seconds. `distress` lasts 20 to 60 seconds before submersion and
     * defaults to 30. `finSwim` and `snorkel` default to 4 seconds. `duckDive`
     * uses a 30-second breath-hold budget by default and refuses a depth it
     * cannot reach and return from in that time.
     *
     * `rescueTow` uses this field to limit the approach to the victim. Omit it
     * to leave the approach time unrestricted. A refused approach reports the
     * reachable distance for the supplied time.
     */
    duration?: number;

    /**
     * The other performer's ID for a tow or lift. The rescuer names the person
     * receiving help, and the towed or lifted performer names the rescuer.
     * During a tow the rescuer's hold tracks the other performer's chest.
     */
    partner?: string;

    /**
     * Depth below the surface in metres. `finSwim` holds the hips at this depth
     * and defaults to 2. `duckDive` defaults to 3 and requires a positive depth
     * within the breath-hold budget.
     */
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
