/** Aim one station at a target, or refuse it when the two coincide.  * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Fixes the slack under which two derived observation stations are one station.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Bounds the numeric tolerance the derivation is deterministic under.
 * @author Samchon
 */
export const aim = (
  position: IAutoMovieVector3,
  target: IAutoMovieVector3,
): IAutoMovieSpaceObservationStation["pose"] => {
  const offset = Vector3.subtract(target, position);
  if (Vector3.length(offset) <= AUTOMOVIE_OBSERVATION_EPSILON) return null;
  return { position, direction: Vector3.normalize(offset), target };
};
