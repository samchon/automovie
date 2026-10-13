import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The fixed lattice a fluid domain is solved on.
 *
 * Cell `(column, row)` spans `[origin.x + column * cellX, origin.x + (column +
 * 1) * cellX]` along `x` and likewise along `z`; its surface vertex sits at the
 * cell centre. `validateFluidDomain` refuses a lattice of more than 65,536
 * cells.
 *
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
