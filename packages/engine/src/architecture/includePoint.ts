/** Grow a box by one point, creating it when there is none yet.  * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Fixes the slack under which two derived observation stations are one station.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Bounds the numeric tolerance the derivation is deterministic under.
 * @author Samchon
 */
export const includePoint = (
  box: IAutoMovieSubjectBox | null,
  point: IAutoMovieVector3,
): IAutoMovieSubjectBox =>
  box === null
    ? { min: { ...point }, max: { ...point } }
    : {
        min: {
          x: Math.min(box.min.x, point.x),
          y: Math.min(box.min.y, point.y),
          z: Math.min(box.min.z, point.z),
        },
        max: {
          x: Math.max(box.max.x, point.x),
          y: Math.max(box.max.y, point.y),
          z: Math.max(box.max.z, point.z),
        },
      };
