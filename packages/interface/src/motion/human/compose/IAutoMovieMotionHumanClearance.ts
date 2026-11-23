/**
 * The path of a swinging foot over a profile it must clear: the shortest path
 * from where it leaves to where it lands that stays on or above a required
 * height everywhere between, with its corners rounded.
 *
 * A foot stepping onto a stair, over a threshold or across an obstacle moves in
 * the vertical plane of its step. What it must clear is a height required of
 * its ankle at each place along the step (the surface under each point of its
 * sole there, plus the clearance near an edge). The shortest path above such a
 * profile is the taut string over it: the upper convex hull of the profile
 * between the two ends, which rises steeply beside a riser, runs along the line
 * of the nosings and drops once the sole is past the last edge, as the foot's
 * path on stairs does. The hull's corners are rounded within `RADIUS` so the
 * foot's direction turns smoothly, which lowers the path by at most half the
 * radius at a corner; the caller's clearance carries that.
 */
export namespace IAutoMovieMotionHumanClearance {
  /** A point of the step's vertical plane. */
  export interface IPoint {
    /** Distance along the step, metres. */
    z: number;

    /** Height, metres. */
    y: number;
  }
}
