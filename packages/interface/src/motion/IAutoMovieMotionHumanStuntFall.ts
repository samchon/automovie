/**
 * Staged stunt falls: tumbling down a staircase over its treads, or the
 * controlled seat slide, and a high fall from a ledge onto a pad or the ground.
 * Register `HumanStuntFall.stuntFall` to use it.
 *
 * A tumble reads the named stair prop's steps and slides down them on the back
 * and sides with Coulomb friction, each contact on a tread's nosing, ending
 * lying on the floor below; a flight too short for a tumble is refused, and the
 * seat slide needs only one step. A high fall leaves the ledge, flies
 * ballistically turning to lie flat on its back, and lands on the named pad's
 * top, which yields, or on the ground in a collapse; a pad the flight does not
 * reach is refused. A descender slows the descent to its final speed instead.
 */
export namespace IAutoMovieMotionHumanStuntFall {
  /**
   * How a high fall leaves the ledge: a step off forward, a tip backward or a
   * throw outward.
   */
  export type Exit = "step" | "tip" | "thrown";

  /** Tumble down a staircase, or slide down it on the seat. */
  export interface IStairs {
    /** Discriminant: a stair fall. */
    kind: "stairs";

    /** Subject of the fixed stair prop. */
    stairs: string;

    /** A controlled slide on the seat instead of a tumble; a tumble when absent. */
    slide?: boolean;
  }

  /** Fall from a ledge onto a pad or the ground. */
  export interface IHigh {
    /** Discriminant: a high fall. */
    kind: "high";

    /** How the body leaves the ledge; `step` when absent. */
    exit?: Exit;

    /** Subject of the pad or airbag landed on; the ground when absent. */
    pad?: string;

    /** Id of the pad's top surface affordance; `surface` when absent. */
    top?: string;

    /** A descender's final speed, metres per second; a free fall when absent. */
    descender?: number;
  }

  /** Parameters: a stair fall or a high fall. */
  export type IParams = IStairs | IHigh;
}
