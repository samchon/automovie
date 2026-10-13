/**
 * Lens the inspection looks through.
 *
 * @author Samchon
 */
export interface IAutoMovieViewerSubjectLens {
  /**
   * Vertical field of view in degrees.
   */
  fovDeg: number;

  /**
   * Viewport width divided by height.
   *
   * The horizontal field follows from this, and framing uses whichever of the
   * two fields is narrower, so a subject stays inside a portrait viewport.
   */
  aspect: number;
}
