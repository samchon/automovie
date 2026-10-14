import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The fixed lattice a fluid domain is solved on.
 *
 * Cell (column, row) spans origin.x + column * cellX through origin.x + (column + 1) * cellX on X, with the analogous Z interval; its surface vertex sits at the centre. validateFluidDomain rejects more than 65,536 cells.
 *
 * @evidence contracts/common.md#principled-implementation A uniform axis-aligned rectangular lattice, which the solver's finite differences, `fluidSurfaceGeometry`'s centred vertices and `validateWaterFeatures`' basin test all address by `origin + (index + 0.5) * cell` with no per-cell geometry.
 * @evidence contracts/common.md#clear-and-simple-design Two counts, two cell sizes and one corner fully determine every cell, so no rotation, cell list or variable spacing is stored that the current solver could not use.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record carries no rotation or per-cell offset the solver would ignore; an irregular basin is expressed through `solid` cells and checked against its space by `validateWaterFeatures`, not approximated by a transformed grid.
 * @evidence contracts/common.md#meaningful-documentation States each cell's world span, where its vertex sits, and the cell cap; members give the axis, units, integer and positivity rules, and the two roles of `origin`.
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
   * Finite world corner for cell (0, 0). X and Z give that cell's minimum corner, while Y is the datum for bed elevations and drain sills.
   */
  origin: IAutoMovieVector3;
}
