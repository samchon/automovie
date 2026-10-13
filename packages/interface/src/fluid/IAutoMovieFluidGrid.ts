import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** The fixed lattice a fluid domain is solved on. */
export interface IAutoMovieFluidGrid {
  /** Cell count along `+x`; at least 1. */
  columns: number;

  /** Cell count along `+z`; at least 1. */
  rows: number;

  /** Cell size along `+x` in metres; strictly positive. */
  cellX: number;

  /** Cell size along `+z` in metres; strictly positive. */
  cellZ: number;

  /**
   * World position of the lattice corner at `column = 0, row = 0`. `x`/`z` are
   * the minimum corner of that cell; `y` is the datum every `bed` value is
   * measured above.
   */
  origin: IAutoMovieVector3;
}
