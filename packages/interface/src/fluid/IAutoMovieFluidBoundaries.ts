import { AutoMovieFluidBoundaryKind } from "./AutoMovieFluidBoundaryKind";

/**
 * Which lattice edge reflects and which lets water leave the domain.
 *
 * Each of the four edges is chosen independently, so a channel can be open at
 * both ends and walled along its banks. `validateFluidDomain` refuses any value
 * other than `wall` or `open` on each edge.
 *
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
