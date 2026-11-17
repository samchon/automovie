/**
 * Bound on every possible contact of an anchored fan with one support face,
 * returned by `boundAutoMovieTriangleAttachmentContact`.
 *
 * When `proved` is true, any contact lies within `cap` metres of the fan's
 * registered root. `cornerGap` and `rootDeficit` are the outward-rounded slab
 * quantities s and delta behind that cap, projected on the support's stored
 * face direction scaled so its largest component is one; they are therefore
 * metres times a norm in [1, sqrt(3)], and only their ratio enters the cap. A
 * collapsed support reports all zeros, and a nonpositive corner gap leaves the
 * proof false with the measured gap and deficit kept for diagnosis.
 *
 * @evidence contracts/development/design.md#principled-representation The cap is delta over delta plus s, the largest non-root barycentric weight any contact can carry, times the largest corner L1 distance from the root, with every operation rounded outward, so it encloses every contact point of the complete fan rather than a sampled nearest one.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The decision, the cap and the two slab quantities, so the separation query keeps only the cap while a test or diagnostic can see which quantity failed; the root and supports are not echoed because the caller passed them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An unproved bound reports a zero cap instead of a guessed one, and the scaled projection unit is stated rather than presented as a Euclidean height, so no field claims more than the slab arithmetic proved.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, what proved guarantees, the meaning and true unit of the slab quantities, and the collapsed and nonpositive-gap results.
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
