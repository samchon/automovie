import {
  IAutoMovieBuiltSpace,
  IAutoMovieConvexSpaceCell,
  IAutoMovieSubjectBox,
  IAutoMovieVector3,
} from "@automovie/interface";

import { builtConvexCellVertices } from "./builtConvexCellVertices";
import { builtPointBounds } from "./builtPointBounds";

/*
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
 * Parameter space: Logical space whose stated volume is boxed.
 * Returns: A new world box, or null when the space states no corner.
 */
export function builtSpaceVolumeBounds(
  space: IAutoMovieBuiltSpace,
): IAutoMovieSubjectBox | null {
  return builtPointBounds(
    space.shell !== undefined
      ? space.shell.vertices
      : space.cells.flatMap(
          (cell: IAutoMovieConvexSpaceCell): IAutoMovieVector3[] =>
            builtConvexCellVertices(cell),
        ),
  );
}
