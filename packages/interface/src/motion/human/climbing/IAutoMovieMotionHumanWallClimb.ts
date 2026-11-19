import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanSupport } from "../actions/IAutoMovieMotionHumanSupport";
import type { IAutoMovieMotionHumanClimbLadder } from "./IAutoMovieMotionHumanClimbLadder";

/**
 * An authored wall-climbing route on fixed holds. The climber starts with a
 * hold for each hand and foot, then moves or releases one limb at a time.
 * The support planner fits grip-socket and toe positions and admits the route
 * against reach. Finger closure and wall contact forces are outside this fit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the initial support, move order and owner of reach admission.
 * @evidence contracts/development/design.md#principled-representation A complete four-limb starting stance and an ordered list of single-limb changes model the route. The support action resolves the hold frames and checks reach.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `wallClimbSupport` reads the starting holds and the moves to build support stances.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the existing climbing limbs and shared motion targets with no fitted poses or preselected holds.
 */
export interface IAutoMovieMotionHumanWallClimb {
  /** Holds in the starting stance, one for each hand and foot. */
  start: Readonly<
    Record<
      IAutoMovieMotionHumanClimbLadder.Limb,
      IAutoMovieMotionHumanWallClimb.Hold
    >
  >;

  /** Hold changes in film order. An empty route places just the starting stance. */
  moves: readonly IAutoMovieMotionHumanWallClimb.IMove[];
}

/**
 * The hold and move contracts read by the wall-climb authoring function.
 */
export namespace IAutoMovieMotionHumanWallClimb {
  /**
   * A fixed prop's named hold or a fixed point in metres in the target's frame.
   * The support action resolves it at entry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the permitted targets, their units and when they are resolved.
   * @evidence contracts/development/design.md#principled-representation A hold is a physical location referenced by prop and point name or by an explicit point and frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A projection of the target union used to build and fit support contacts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Excludes person, self and imaginary targets by the existing discriminant.
   */
  export type Hold = Extract<
    IAutoMovieMotionTarget,
    { kind: "prop" | "point" }
  >;

  /**
   * One limb reaches a hold or releases it. Other limbs retain their current
   * assignments. A release must leave at least three contacts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what changes and what stays assigned.
   * @evidence contracts/development/design.md#principled-representation One limb and an optional destination encode transfer and release while keeping other assignments implicit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `wallClimbSupport` reads the destination and optional stance timing and labels.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the common climbing limb and target contracts without an embedded posture.
   */
  export interface IMove
    extends Pick<IAutoMovieMotionHumanSupport.IStance, "seconds" | "event" | "turn"> {
    /** The limb that moves. */
    limb: IAutoMovieMotionHumanClimbLadder.Limb;

    /** The destination hold, or null to release this limb without acquiring another hold. */
    to: IAutoMovieMotionHumanWallClimb.Hold | null;
  }
}
