/**
 * One point on the host face, in face-local metres.
 *
 * For a host that folds or curves, the face-local plane is the developed
 * surface, so distance along U is distance along the building. A point reaches
 * world space only through an `IAutoMoviePatternFaceFrame` or an
 * `IAutoMoviePatternFacet`, and the pattern functions refuse a non-finite
 * coordinate wherever they read one.
 *
 * @evidence contracts/common.md#principled-implementation A 2D Cartesian coordinate on the developed face, the plane on which joints, cut pieces and take-off are measured.
 * @evidence contracts/common.md#clear-and-simple-design Uses `u` and `v` member names, distinct from the `x` and `y` of `IAutoMoviePlanarPoint`, so a face-local point and a boundary outline point cannot be swapped structurally.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Implies no origin or axes; meaning comes only from the frame or facet a consumer applies, and no consumer substitutes a default frame.
 * @evidence contracts/common.md#meaningful-documentation States the unit, that the plane is the developed surface, how a point reaches world space, and the finiteness refusal.
 * @evidenceExclude contracts/performance.md#cost-and-resources Two numbers with no behavior, copied rather than shared when a placement records its centre.
 * @author Samchon
 */
export interface IAutoMoviePatternPoint {
  /** Distance along the face's local U axis, in metres. */
  u: number;

  /** Distance along the face's local V axis, in metres. */
  v: number;
}
