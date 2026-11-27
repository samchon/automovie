import type { IAutoMovieMotionHumanArmGeometry } from "./IAutoMovieMotionHumanArmGeometry";
import type { IAutoMovieMotionHumanJacobian } from "./IAutoMovieMotionHumanJacobian";

/**
 * The analytic Jacobian of the arm planner's coordinates: for each free
 * coordinate, the twist of the upper arm, the forearm and the hand, so a point
 * riding a segment moves at `v_origin + ω × (p − origin)`.
 *
 * The elbow's and the wrist's coordinates are their joints' clinical angles,
 * whose motions are the rig's own joint axes (`HumanJacobian.of`) read on the
 * planner's placed chain; an angle past the skeleton's range, which forward
 * kinematics clamps (`HumanArmGeometry.rotation`), moves nothing, so its column
 * is zero. The shoulder's three are the swing-twist chart's
 * (`HumanArmGeometry.shoulder`), whose turn per coordinate is the chart's own
 * derivative: the world rotation of the upper arm read at the coordinate a hair
 * either side, the shoulder's point fixed, the forearm and the hand carried
 * with it.
 */
export namespace IAutoMovieMotionHumanArmJacobian {
  /**
   * One coordinate's motion of the arm's three segments, per coordinate unit:
   * radians and metres at each segment's origin (the shoulder, the elbow, the
   * wrist).
   */
  export interface IColumn {
    /** The upper arm's twist. */
    upper: IAutoMovieMotionHumanJacobian.ITwist;
    /** The forearm's twist. */
    lower: IAutoMovieMotionHumanJacobian.ITwist;
    /** The hand's twist. */
    hand: IAutoMovieMotionHumanJacobian.ITwist;
  }

  /**
   * An arm's chain placed at coordinates: each joint's point and each segment's
   * world rotation.
   */
  export type IChain = Pick<
    IAutoMovieMotionHumanArmGeometry.IPlaced,
    "shoulder" | "elbow" | "wrist" | "upper" | "lower" | "hand"
  >;

  /**
   * One arm of a body on a pose, read at an arm moved by an offset in the
   * planner's coordinates: every coordinate's column, and the chain at any
   * coordinates, the forward kinematics the columns differentiate. Result
   * returned by HumanArmJacobian.read. The coordinates read at, the free ones
   * (a hinge's fixed angle is not), their columns in that order and the chain.
   */
  export type IReadResult = {
    /**
     * Nine planner coordinates: the shoulder chart's first three coordinates
     * followed by elbow and wrist clinical-degree triples.
     */
    c: number[];
    /** Zero-based indices of freely variable coordinates in c. */
    free: number[];
    /**
     * Derivative columns in the same order as free, with respect to each
     * coordinate's own unit.
     */
    columns: IAutoMovieMotionHumanArmJacobian.IColumn[];
    /**
     * Pure synchronous forward-kinematics callback for the supplied coordinate
     * vector; borrowed coordinates must remain stable for the call.
     */
    chain: (c: readonly number[]) => IAutoMovieMotionHumanArmJacobian.IChain;
  };
}
