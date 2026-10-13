import { AutoMovieFluidBoundaryKind } from "./AutoMovieFluidBoundaryKind";

/**
 * Which lattice edge reflects and which lets water leave the domain.
 *
 * Each of the four edges is chosen independently, so a channel can be open at
 * both ends and walled along its banks. `validateFluidDomain` refuses any value
 * other than `wall` or `open` on each edge.
 *
 * @evidence contracts/common.md#principled-implementation Each edge maps its row or column of boundary faces to a reflecting condition (velocity pinned to zero) or an outflow condition (a permanently dry ghost cell at the boundary cell's own bed), which is how `simulateFluidDomain` reads `xMin`, `xMax`, `zMin` and `zMax`.
 * @evidence contracts/common.md#clear-and-simple-design Four named fields, one per axis-aligned lattice edge, because the solver only ever asks about those four; reflection inside the lattice belongs to the domain's per-cell `solid` array instead.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No edge or lattice size is special-cased; volume spilled over an `open` edge is counted in `outflowVolume`, so letting water leave is a declared ledger term rather than a silent loss.
 * @evidence contracts/common.md#meaningful-documentation States which faces each field governs, that edges are independent, and which values validation accepts; the meaning of each kind lives on `AutoMovieFluidBoundaryKind`.
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
