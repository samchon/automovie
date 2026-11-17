/**
 * One point on the host face, in face-local metres.
 *
 * For a folded/curved host, the face-local plane is the developed surface. A point reaches world space through an `IAutoMoviePatternFaceFrame` or `IAutoMoviePatternFacet`. Authoring entry points check finite coordinates; low-level area/clipping helpers assume their numerical premises and do not independently validate every point.
 *
 * @evidence contracts/development/design.md#principled-representation A two-coordinate point on the developed host surface, the plane in which joints, clips and areas are measured.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two fields shared by every pattern record, so the run's geometry speaks one face-local unit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A point reaches world space only through a frame or facet, never through an implicit default plane.
 * @evidence contracts/development/common.md#meaningful-documentation States the local frame, developed-surface meaning, world conversion and distinction between entry-point validation and unchecked low-level arithmetic.
 */
export interface IAutoMoviePatternPoint {
  /** Distance along the face's local U axis, in metres. */
  u: number;

  /** Distance along the face's local V axis, in metres. */
  v: number;
}
