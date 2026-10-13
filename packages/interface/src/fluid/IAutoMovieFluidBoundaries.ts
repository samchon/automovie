import { AutoMovieFluidBoundaryKind } from "./AutoMovieFluidBoundaryKind";

/**
 * Which lattice edge reflects and which lets water leave the domain.
 *
 * Each of the four edges is chosen independently, so a channel can be open at
 * both ends and walled along its banks. `validateFluidDomain` refuses any value
 * other than `wall` or `open` on each edge. Solid cells reflect on their own
 * faces whatever the edges say.
 *
 * @evidence contracts/common.md#principled-implementation `simulateFluidDomain` consults `xMin` and `xMax` for the outermost x faces of every row and `zMin` and `zMax` for the outermost z faces of every column, the only faces with a missing neighbour cell.
 * @evidence contracts/common.md#clear-and-simple-design Four named fields, one per axis-aligned edge of the rectangular lattice, need no per-face list because every face on one edge shares its condition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No edge has a default; all four are required, so an author states the condition of each rim instead of the solver assuming a wall.
 * @evidence contracts/common.md#meaningful-documentation States that edges are independent with an example, the validator's refusal, and how solid cells relate; members say which faces each edge governs by column or row index.
 * @author Samchon
 */
export interface IAutoMovieFluidBoundaries {
  /** Edge on the `-x` side: the faces before cell column `0`. */
  xMin: AutoMovieFluidBoundaryKind;

  /** Edge on the `+x` side: the faces past cell column `columns - 1`. */
  xMax: AutoMovieFluidBoundaryKind;

  /** Edge on the `-z` side: the faces before cell row `0`. */
  zMin: AutoMovieFluidBoundaryKind;

  /** Edge on the `+z` side: the faces past cell row `rows - 1`. */
  zMax: AutoMovieFluidBoundaryKind;
}
