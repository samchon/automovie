import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanSupport } from "./IAutoMovieMotionHumanSupport";
import type { IAutoMovieMotionHumanClimbLadder } from "./IAutoMovieMotionHumanClimbLadder";

/**
 * An authored wall-climbing route on fixed holds. The climber starts with a
 * hold for each hand and foot, then moves or releases one limb at a time. The
 * support planner fits grip-socket and toe positions and admits the route
 * against reach. Finger closure and wall contact forces are outside this fit.
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

/** The hold and move contracts read by the wall-climb authoring function. */
export namespace IAutoMovieMotionHumanWallClimb {
  /**
   * A fixed prop's named hold or a fixed point in metres in the target's frame.
   * The support action resolves it at entry.
   */
  export type Hold = Extract<
    IAutoMovieMotionTarget,
    { kind: "prop" | "point" }
  >;

  /**
   * One limb reaches a hold or releases it. Other limbs retain their current
   * assignments. A release must leave at least three contacts.
   */
  export interface IMove extends Pick<
    IAutoMovieMotionHumanSupport.IStance,
    "seconds" | "event" | "turn"
  > {
    /** The limb that moves. */
    limb: IAutoMovieMotionHumanClimbLadder.Limb;

    /**
     * The destination hold, or null to release this limb without acquiring
     * another hold.
     */
    to: IAutoMovieMotionHumanWallClimb.Hold | null;
  }
}
