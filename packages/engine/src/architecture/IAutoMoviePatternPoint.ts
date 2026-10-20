/**
 * One point on the host face, in face-local metres.
 *
 * For a folded/curved host, the face-local plane is the developed surface. A point reaches world space through an `IAutoMoviePatternFaceFrame` or `IAutoMoviePatternFacet`. Authoring entry points check finite coordinates; low-level area/clipping helpers assume their numerical premises and do not independently validate every point.
 *
 * @evidence contracts/common.md#principled-implementation A two-coordinate point on the developed host surface, the plane in which joints, clips and areas are measured.
 * @evidence contracts/common.md#clear-and-simple-design Two fields shared by every pattern record, so the run's geometry speaks one face-local unit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A point reaches world space only through a frame or facet, never through an implicit default plane.
 * @evidence contracts/common.md#meaningful-documentation States the local frame, developed-surface meaning, world conversion and distinction between entry-point validation and unchecked low-level arithmetic.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A value type with no behaviour; operations on points are costed where they run.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Points are authored or computed values, not results of shared work, so nothing about them can be reused across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two numbers held by value inside whichever candidate, placement or outline contains the point.
 */
export interface IAutoMoviePatternPoint {
  /** Distance along the face's local U axis, in metres. */
  u: number;

  /** Distance along the face's local V axis, in metres. */
  v: number;
}
