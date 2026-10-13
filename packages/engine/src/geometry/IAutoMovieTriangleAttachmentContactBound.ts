/**
 * Bound on every possible contact of an anchored fan with one support face.
 *
 * When `proved` is true, any contact lies within `cap` metres of the fan's
 * registered root. `cornerGap` and `rootDeficit` are the outward-rounded slab
 * quantities s and delta behind that cap, measured along the support's stored
 * face direction in the fan's metre frame. A collapsed support reports all
 * zeros and a nonpositive corner gap leaves the proof false.
 *
 * @author Samchon
 */
export interface IAutoMovieTriangleAttachmentContactBound {
  /**
   * Whether the cap bounds every contact of the complete fan with the support.
   */
  proved: boolean;

  /**
   * Upper bound, in metres, on a contact point's distance from the root; zero
   * when unproved.
   */
  cap: number;

  /** Outward-rounded smallest corner height above the support slab, s. */
  cornerGap: number;

  /** Nonnegative depth of the root below the support slab's top, delta. */
  rootDeficit: number;
}
