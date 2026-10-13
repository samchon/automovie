import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The fixed lattice a fluid domain is solved on.
 *
 * Cell `(column, row)` spans `[origin.x + column * cellX, origin.x + (column +
 * 1) * cellX]` along `x` and likewise along `z`; its surface vertex sits at the
 * cell centre. `validateFluidDomain` refuses a lattice of more than 65,536
 * cells.
 *
 * @evidence contracts/common.md#principled-implementation A uniform axis-aligned rectangular lattice in the XZ plane, which is what the C-grid face indexing and the Courant term `sqrt(1/dx² + 1/dz²)` assume; a curved or rotated basin is approximated by marking `solid` cells inside it.
 * @evidence contracts/common.md#clear-and-simple-design Two counts, two cell sizes and one corner point determine every cell and face position, so the bed and depth arrays never repeat coordinates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No lattice size is special-cased; the 65,536-cell cap is a declared budget that validation refuses past, never a quiet clamp of the authored dimensions.
 * @evidence contracts/common.md#meaningful-documentation States the axis of each count, the metre unit, the positivity and integer bounds, the cell cap, how a cell's extent follows from the fields, which corner `origin` names, and that `origin.y` is the bed datum.
 * @author Samchon
 */
export interface IAutoMovieFluidGrid {
  /** Cell count along `+x`; a safe integer of at least 1. */
  columns: number;

  /** Cell count along `+z`; a safe integer of at least 1. */
  rows: number;

  /** Cell size along `+x` in metres; finite and strictly positive. */
  cellX: number;

  /** Cell size along `+z` in metres; finite and strictly positive. */
  cellZ: number;

  /**
   * World position of the lattice corner at `column = 0, row = 0`. `x`/`z` are
   * the minimum corner of that cell; `y` is the datum every `bed` value is
   * measured above.
   */
  origin: IAutoMovieVector3;
}
