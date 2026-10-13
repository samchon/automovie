import { AutoMovieFluidBoundaryKind } from "./AutoMovieFluidBoundaryKind";

/** Which lattice edge reflects and which lets water leave the domain. */
export interface IAutoMovieFluidBoundaries {
  /** Edge at `column = 0`. */
  xMin: AutoMovieFluidBoundaryKind;

  /** Edge past `column = columns - 1`. */
  xMax: AutoMovieFluidBoundaryKind;

  /** Edge at `row = 0`. */
  zMin: AutoMovieFluidBoundaryKind;

  /** Edge past `row = rows - 1`. */
  zMax: AutoMovieFluidBoundaryKind;
}
