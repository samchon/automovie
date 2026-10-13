/**
 * One point on the host face, in face-local metres.
 *
 * For a host that folds or curves, the face-local plane is the developed
 * surface, so distance along U is distance along the building. A point reaches
 * world space only through an `IAutoMoviePatternFaceFrame` or an
 * `IAutoMoviePatternFacet`, and the pattern functions refuse a non-finite
 * coordinate wherever they read one.
 *
 * @author Samchon
 */
export interface IAutoMoviePatternPoint {
  /** Distance along the face's local U axis, in metres. */
  u: number;

  /** Distance along the face's local V axis, in metres. */
  v: number;
}
