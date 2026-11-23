import type { AutoMovieFluidBoundaryKind } from "./AutoMovieFluidBoundaryKind";

/**
 * Which lattice edge reflects and which lets water leave the domain.
 *
 * Four independent edges allow open channel ends and walled banks.
 * validateFluidDomain requires wall or open at each edge, while solid cells
 * block their own touching faces independently.
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
