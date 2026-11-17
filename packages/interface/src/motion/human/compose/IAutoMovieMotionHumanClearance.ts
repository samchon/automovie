/**
 * The path of a swinging foot over a profile it must clear: the shortest
 * path from where it leaves to where it lands that stays on or above a
 * required height everywhere between, with its corners rounded.
 *
 * A foot stepping onto a stair, over a threshold or across an obstacle moves
 * in the vertical plane of its step. What it must clear is a height required
 * of its ankle at each place along the step (the surface under each point of
 * its sole there, plus the clearance near an edge). The shortest path above
 * such a profile is the taut string over it: the upper convex hull of the
 * profile between the two ends, which rises steeply beside a riser, runs
 * along the line of the nosings and drops once the sole is past the last
 * edge, as the foot's path on stairs does. The hull's corners are rounded
 * within `RADIUS` so the foot's direction turns smoothly, which lowers the
 * path by at most half the radius at a corner; the caller's clearance
 * carries that.
 *
 * @evidence contracts/development/common.md#meaningful-documentation z: Distance along the step, metres. y: Height, metres.
 * @evidence contracts/development/design.md#principled-representation z: Distance along the step, metres. y: Height, metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanClearance.ts (AutoMovieMotionHumanClearance.path, from); compose/AutoMovieMotionHumanClearance.ts (AutoMovieMotionHumanClearance.path, to); compose/AutoMovieMotionHumanClearance.ts (AutoMovieMotionHumanClearance.path, return); compose/AutoMovieMotionHumanClearance.ts (AutoMovieMotionHumanClearance.path.p, return); compose/AutoMovieMotionHumanClearance.ts (AutoMovieMotionHumanClearance.toward, a); compose/AutoMovieMotionHumanClearance.ts (AutoMovieMotionHumanClearance.toward, b).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in AutoMovieMotionHumanClearance.path.
 */
export namespace IAutoMovieMotionHumanClearance {
  /**
   * A point of the step's vertical plane.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its axis and unit.
   * @evidence contracts/development/design.md#principled-representation Two coordinates of the plane the foot moves in.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by `path`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain numbers.
   */
  export interface IPoint {
    /** Distance along the step, metres. */
    z: number;

    /** Height, metres. */
    y: number;
  }
}
