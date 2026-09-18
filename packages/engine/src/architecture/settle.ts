/** The first point of a ladder toward the interior centre that lands inside.  * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Fixes the slack under which two derived observation stations are one station.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Bounds the numeric tolerance the derivation is deterministic under.
 * @author Samchon
 */
export const settle = (
  space: IAutoMovieBuiltSpace,
  from: IAutoMovieVector3,
  centre: IAutoMovieVector3,
): IAutoMovieVector3 | null => {
  for (const fraction of AUTOMOVIE_OBSERVATION_INSET_LADDER) {
    const point = Vector3.lerp(from, centre, fraction);
    if (builtSpaceContainsPoint(space, point)) return point;
  }
  return null;
};
