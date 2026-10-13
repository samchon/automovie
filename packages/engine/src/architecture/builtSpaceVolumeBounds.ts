import {
  IAutoMovieBuiltSpace,
  IAutoMovieSubjectBox,
  IAutoMovieVector3,
} from "@automovie/interface";

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
 * The box is world-space in metres. Every listed shell vertex counts, used by a
 * triangle or not, and an unbounded cell contributes only the corners it has,
 * so its extent can be understated.
 *
 * @evidence contracts/common.md#principled-implementation For a shell folds every listed vertex into a box, and for cells folds the corners `builtConvexCellVertices` solves per cell; with nothing to fold the answer stays null.
 * @evidence contracts/common.md#clear-and-simple-design Defect: `describeAutoMovieSubject` and `describeAutoMovieSubjects` keep their own cell-corner solver and box fold with a `Number.EPSILON * 64` admission tolerance instead of calling this, so a declared extent can differ between the two paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No origin box is substituted for an empty answer; unreferenced shell vertices and unbounded cells are taken as listed rather than repaired.
 * @evidence contracts/common.md#meaningful-documentation States that both spellings answer here, the vertex and corner sources, the frame and unit, the null cases, and the unreferenced-vertex and unbounded-cell effects.
 * @evidence contracts/performance.md#cost-and-resources Linear in shell vertices, or the cell solver's work per cell (cubic in planes), and `includePoint` allocates a fresh box per point where a mutable fold would allocate once; nothing is cached, which is why the station query can solve a cell twice.
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
