/**
 * One point on the host face, in face-local metres.
 *
 * For a folded/curved host, the face-local plane is the developed surface. A
 * point reaches world space through an `IAutoMoviePatternFaceFrame` or
 * `IAutoMoviePatternFacet`. Authoring entry points check finite coordinates;
 * low-level area/clipping helpers assume their numerical premises and do not
 * independently validate every point.
 */
export interface IAutoMoviePatternPoint {
  /** Distance along the face's local U axis, in metres. */
  u: number;

  /** Distance along the face's local V axis, in metres. */
  v: number;
}
