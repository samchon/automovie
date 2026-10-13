/**
 * Lens the inspection looks through.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership `IAutoMovieViewerSubjectLens` belongs to the inspection rather than to any authored camera.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan `IAutoMovieViewerSubjectLens` types the projection the viewpoint plan states.
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
