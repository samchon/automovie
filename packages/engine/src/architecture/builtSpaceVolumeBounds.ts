import {
  IAutoMovieBuiltSpace,
  IAutoMovieConvexSpaceCell,
  IAutoMovieSubjectBox,
  IAutoMovieVector3,
} from "@automovie/interface";

import { builtConvexCellVertices } from "./builtConvexCellVertices";
import { builtPointBounds } from "./builtPointBounds";

/**
 * The world box one logical space's own stated volume occupies.
 *
 * Both spellings answer here so no consumer has to know which one a space used: a shelled space is bounded by its own vertices and a celled space by the corners its half-spaces cut. A space that states no volume, and a space whose cells close nothing, report null rather than a box of the origin.
 *
 * The box is world-space in metres. Every listed shell vertex counts, used by a triangle or not, and an unbounded cell contributes only the corners it has, so its extent can be understated.
 *
 * @param space Logical space whose stated volume is boxed.
 * @returns A new world box, or null when the space states no corner.
 *
 * @evidence contracts/common.md#principled-implementation The box of a polyhedron is the box of its vertices: a shell's listed vertices, or the corners `builtConvexCellVertices` cuts from each convex cell's half-spaces, folded by `builtPointBounds`; an unbounded cell has no complete corner set, a limitation the documentation states.
 * @evidence contracts/common.md#clear-and-simple-design One branch per volume spelling feeding the shared point fold, so the bounds of either spelling come from the same arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space; a space with no corners answers null rather than an invented origin box.
 * @evidence contracts/common.md#meaningful-documentation States both spellings, the null cases, the frame and unit, that unused shell vertices count, and that an unbounded cell can understate the extent.
 * @evidence contracts/performance.md#efficient-algorithms O(V) for V shell vertices. For C cells, pays O(C) iteration plus each cell's O(N + P³(P + K)) enumeration for input planes N, retained planes P and corners K, then a linear fold over the combined corners. The fold allocates one box rather than one per point.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure read of one space value per call that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the cut corner list only for the call; the caller owns the returned box.
 */
export const builtSpaceVolumeBounds: (
  space: IAutoMovieBuiltSpace,
) => IAutoMovieSubjectBox | null = (
  space: IAutoMovieBuiltSpace,
): IAutoMovieSubjectBox | null =>
  builtPointBounds(
    space.shell !== undefined
      ? space.shell.vertices
      : space.cells.flatMap(
          (cell: IAutoMovieConvexSpaceCell): IAutoMovieVector3[] =>
            builtConvexCellVertices(cell),
        ),
  );
