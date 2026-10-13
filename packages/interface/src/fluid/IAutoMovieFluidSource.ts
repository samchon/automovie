/**
 * One declared inflow into a single cell.
 *
 * The cell must lie inside the lattice and not be solid, and the `id` must be
 * non-blank and unique among the domain's sources. Added volume accumulates in
 * `IAutoMovieFluidState.sourceVolume`.
 *
 * @evidence contracts/common.md#principled-implementation A per-step volume addition of `flowRate * dt` into one cell during a half-open time window, applied in the continuity update and recorded in `sourceVolume`, which keeps the mass ledger exact.
 * @evidence contracts/common.md#clear-and-simple-design Mirrors the drain's cell and window fields without a sill, because an inflow needs no surface-level gate; removal is the drain's job, so the rate is non-negative.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source is special-cased; nothing limits the added water against `solver.referenceDepth`, so a long-running source can deepen a cell past the depth the Courant check assumed.
 * @evidence contracts/common.md#meaningful-documentation States the inflow unit, the sign rule, that the full rate is added whatever the depth, the window bounds and `null` meaning, where added volume is counted, and the site and id rules.
 * @author Samchon
 */
export interface IAutoMovieFluidSource {
  /** Stable source identity within the domain. */
  id: string;

  /** Cell column receiving the water; `0 <= column < grid.columns`. */
  column: number;

  /** Cell row receiving the water; `0 <= row < grid.rows`. */
  row: number;

  /**
   * Volumetric inflow in m³/s; must be `>= 0`. Use a drain to remove water. The
   * full `flowRate * dt` is added at every active step, however deep the cell
   * already is.
   */
  flowRate: number;

  /**
   * Domain-clock second at which the source starts; finite and `>= 0`. A step
   * receives water when its start time `t` satisfies `start <= t < end`.
   */
  start: number;

  /**
   * Domain-clock second at which it stops, strictly after `start`, or `null`
   * for "never".
   */
  end: number | null;
}
