/**
 * One point on the host face, in face-local metres.
 *
 * For a host that folds or curves, the face-local plane is the developed
 * surface, so distance along U is distance along the building. A point reaches
 * world space only through an `IAutoMoviePatternFaceFrame` or an
 * `IAutoMoviePatternFacet`, and the pattern functions refuse a non-finite
 * coordinate wherever they read one.
 *
 * @evidence contracts/common.md#principled-implementation A two-coordinate point on the developed host surface, the plane in which joints, clips and areas are measured.
 * @evidence contracts/common.md#clear-and-simple-design Two fields shared by every pattern record, so the run's geometry speaks one face-local unit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A point reaches world space only through a frame or facet, never through an implicit default plane.
 * @evidence contracts/common.md#meaningful-documentation States the frame it lives in, the developed-surface meaning, how it reaches world space, and that non-finite coordinates are refused.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A value type with no behaviour; operations on points are costed where they run.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Points are authored or computed values, not results of shared work, so nothing about them can be reused across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two numbers held by value inside whichever candidate, placement or outline contains the point.
 * @author Samchon
 */
export interface IAutoMoviePatternPoint {
  /** Distance along the face's local U axis, in metres. */
  u: number;

  /** Distance along the face's local V axis, in metres. */
  v: number;
}
