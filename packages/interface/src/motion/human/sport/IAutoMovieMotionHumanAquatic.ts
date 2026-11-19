import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Timed pool, aquatic team and small-craft performances. Water is a world
 * reference plane. Named supports and tools come from the performance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the reference frames and where supports come from.
 * @evidence contracts/development/design.md#principled-representation Closed action kinds and named scene objects distinguish pool, team and boat staging.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The aquatic planner owns runtime admission and motion; this type contains author inputs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Water and the launch target use world units; no scene object geometry is encoded in the contract.
 */
export namespace IAutoMovieMotionHumanAquatic {
  /**
   * Aquatic sequence selected by the caller. The two race kinds include a
   * start and turn, and the two sailing kinds distinguish completion and abort.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the named variants select and distinguishes the authored outcomes.
   * @evidence contracts/development/design.md#principled-representation Closed choices identify distinct motions or outcomes without requiring combinations of flags.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The aquatic law dispatches this discriminator; runtime movement and prop reading stay with its planners.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The terms distinguish the enacted stroke, figure or maneuver without embedding fitted body, tool or venue values.
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
    | "sailAbort";

  /**
   * Authored staging inputs. The aquatic law admits the selected combination
   * and resolves named supports and participants on the film clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each field states the required meaning, coordinate frame, domain or default where applicable.
   * @evidence contracts/development/design.md#principled-representation The kind and role describe staging while subject and affordance ids identify actual scene supports.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The sport lexicon and aquatic law consume these inputs. Motion solving and prop tracks remain outside the declaration.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts World points use the canonical vector and metre units, and named supports use the performance's prop lookup instead of a second geometry record.
   */
  export interface IParams {
    /** The sequence. */
    kind: Kind;

    /** The world height of the water surface in metres; zero when omitted. */
    water?: number;

    /** Boat subject id for a craft, or optional end-wall subject for pool contact metadata. */
    support?: string;

    /** Paddle or water polo ball subject id. */
    prop?: string;

    /** End wall distance ahead of the entry, in metres, when no wall prop is supplied. The race default is 6. */
    wall?: number;

    /** World point in metres through which a held ball should pass after release. */
    at?: IAutoMovieVector3;

    /** Working side for single-blade canoe and water polo, or initial side of the dinghy. */
    side?: "left" | "right";

    /** Start offset as a fraction of a stroke or figure for crew contrast, in [0, 1]. */
    phase?: number;

    /** Polo attack or defense, artistic figure role, or dinghy crew role. */
    role?: "attack" | "defend" | "keeper" | "figure" | "base" | "flyer" | "helm" | "crew";

    /** The two previously composed base swimmers supplying the flyer’s left and right foot supports. */
    bases?: readonly [string, string];

    /** Optional prop-local foot reference for a seated stroke or initial dinghy stance. */
    footRest?: IAutoMovieVector3;

    /** Named support affordance at the left hand; can track a moving oar, tiller or sheet. */
    leftGrip?: string;

    /** Named support affordance at the right hand; can track a moving oar, tiller or sheet. */
    rightGrip?: string;

    /** Optional turning articulation of the dinghy boom, with signed port/starboard travel. */
    boom?: string;

    /** Optional turning articulation of the dinghy rudder, with signed helm travel. */
    rudder?: string;
  }
}
