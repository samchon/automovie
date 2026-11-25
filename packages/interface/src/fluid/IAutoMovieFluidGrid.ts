import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The fixed lattice a fluid domain is solved on.
 *
 * Cell (column, row) spans origin.x + column * cellX through origin.x + (column
 * + 1) * cellX on X, with the analogous Z interval; its surface vertex sits at
 * the centre. validateFluidDomain rejects more than 65,536 cells.
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
   * Finite world corner for cell (0, 0). X and Z give that cell's minimum
   * corner, while Y is the datum for bed elevations and drain sills.
   */
  origin: IAutoMovieVector3;
}
