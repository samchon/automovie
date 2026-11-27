/**
 * Bound on every possible contact of an anchored fan with one support face,
 * returned by `boundTriangleAttachmentContact`.
 *
 * When `proved` is true, any contact lies within `cap` metres of the fan's
 * registered root. `cornerGap` and `rootDeficit` are the outward-rounded slab
 * quantities s and delta behind that cap, projected on the support's stored
 * face direction scaled so its largest component is one; they are therefore
 * metres times a norm in [1, sqrt(3)], and only their ratio enters the cap. A
 * collapsed support reports all zeros, and a nonpositive corner gap leaves the
 * proof false with the measured gap and deficit kept for diagnosis.
 */
export interface IAutoMovieTriangleAttachmentContactBound {
  /** Whether the cap bounds every contact of the complete fan with the support. */
  proved: boolean;

  /**
   * Upper bound, in metres, on a contact point's distance from the root; zero
   * when unproved.
   */
  cap: number;

  /**
   * Outward-rounded smallest height of the two non-root corners above the
   * support slab's top, s, in the scaled projection unit; zero for a collapsed
   * support.
   */
  cornerGap: number;

  /**
   * Nonnegative depth of the root below the support slab's top, delta, in the
   * same scaled projection unit.
   */
  rootDeficit: number;
}
