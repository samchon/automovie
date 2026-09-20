import { IAutoMovieBuiltSpace, IAutoMovieSubjectBox, IAutoMovieVector3 } from "@automovie/interface";
import { builtConvexCellVertices } from "./builtConvexCellVertices";

/** Grow a box by one point, creating it when there is none yet. */
const includePoint = (
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

/**
 * The world box one logical space's own stated volume occupies.
 *
 * Both spellings answer here so no consumer has to know which one a space used:
 * a shelled space is bounded by its own vertices and a celled space by the
 * corners its half-spaces cut. A space that states no volume, and a space whose
 * cells close nothing, report null rather than a box of the origin.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Measures the extent an interior observation population is laid out inside.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Derives one world extent from either stated volume spelling.
 */
export const builtSpaceVolumeBounds = (
  space: IAutoMovieBuiltSpace,
): IAutoMovieSubjectBox | null => {
  let box: IAutoMovieSubjectBox | null = null;
  if (space.shell !== undefined) {
    for (const vertex of space.shell.vertices) box = includePoint(box, vertex);
    return box;
  }
  for (const cell of space.cells)
    for (const vertex of builtConvexCellVertices(cell))
      box = includePoint(box, vertex);
  return box;
};
