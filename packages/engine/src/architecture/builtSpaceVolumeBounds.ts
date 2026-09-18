import { IAutoMovieBuiltSpace, IAutoMoviePlanarPoint, IAutoMovieSubjectBox } from "@automovie/interface";
import { AUTOMOVIE_OBSERVATION_EPSILON } from "./AUTOMOVIE_OBSERVATION_EPSILON";
import { builtConvexCellVertices } from "./builtConvexCellVertices";

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

/** Area-weighted centroid of a planar outline, or its vertex mean when flat. */
const outlineCentroid = (
  outline: readonly IAutoMoviePlanarPoint[],
): IAutoMoviePlanarPoint => {
  let doubleArea = 0;
  let x = 0;
  let y = 0;
  for (let index = 0; index < outline.length; index++) {
    const from = outline[index]!;
    const to = outline[(index + 1) % outline.length]!;
    const cross = from.x * to.y - to.x * from.y;
    doubleArea += cross;
    x += (from.x + to.x) * cross;
    y += (from.y + to.y) * cross;
  }
  if (Math.abs(doubleArea) <= AUTOMOVIE_OBSERVATION_EPSILON)
    return {
      x: outline.reduce((sum, point) => sum + point.x, 0) / outline.length,
      y: outline.reduce((sum, point) => sum + point.y, 0) / outline.length,
    };
  return { x: x / (3 * doubleArea), y: y / (3 * doubleArea) };
};
