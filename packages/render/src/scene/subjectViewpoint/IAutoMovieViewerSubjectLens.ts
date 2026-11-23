/**
 * Vertical perspective field of view in degrees and width/height aspect for
 * subject inspection.
 */
export interface IAutoMovieViewerSubjectLens {
  /** Vertical field of view in degrees. */
  fovDeg: number;

  /**
   * Viewport width divided by height.
   *
   * The horizontal field follows from this, and framing uses the narrower
   * half-angle for its sphere fit. Actual containment still depends on valid
   * bounds, a distance factor of at least one and noncropping clip planes; this
   * record proves no displayed pixels.
   */
  aspect: number;
}
