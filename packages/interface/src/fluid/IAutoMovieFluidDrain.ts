/**
 * One declared outflow from a single cell.
 *
 * The cell must lie inside the lattice and not be solid, and the `id` must be
 * non-blank and unique among the domain's drains. Removed volume accumulates in
 * `IAutoMovieFluidState.drainVolume`.
 *
 * @evidence contracts/common.md#principled-implementation A per-step volume sink of `flowRate * dt`, gated by a sill comparison and a half-open time window and scaled by the same limiter factor as the cell's outgoing face fluxes, so depth never goes negative and the ledger records only what actually left.
 * @evidence contracts/common.md#clear-and-simple-design Cell coordinates rather than a world point, because the solver applies a drain to exactly one lattice cell; the sill and the window are the only gates, and a plain floor drain sets the sill to its bed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No drain kind or cell is special-cased; validation refuses a blank or duplicate id, an out-of-range or solid cell, a negative rate, a non-finite sill, and an `end` that is not after `start`.
 * @evidence contracts/common.md#meaningful-documentation States the flow unit, that the realized rate is limited and how, which surface the sill is compared with and against which datum, the window bounds, the `null` meaning, and where removed volume is counted.
 * @author Samchon
 */
export interface IAutoMovieFluidDrain {
  /** Stable drain identity within the domain. */
  id: string;

  /** Cell column the water leaves from; `0 <= column < grid.columns`. */
  column: number;

  /** Cell row the water leaves from; `0 <= row < grid.rows`. */
  row: number;

  /**
   * Maximum volumetric outflow in m³/s; must be `>= 0`. The realized rate is
   * limited by the water actually available in the cell during the step: when
   * the drain and the cell's outgoing faces together ask for more than it
   * holds, all of them are scaled by the same factor.
   */
  flowRate: number;

  /**
   * Free-surface elevation in metres above `grid.origin.y` below which the
   * drain is closed: the sill of an overflow weir, or the bed elevation for a
   * plain floor drain. The drain runs during a step only while the cell's `bed +
   * depth` at the step's start stands strictly above it.
   */
  sillLevel: number;

  /**
   * Domain-clock second at which the drain opens; finite and `>= 0`. A step
   * drains when its start time `t` satisfies `start <= t < end`.
   */
  start: number;

  /**
   * Domain-clock second at which it closes, strictly after `start`, or `null`
   * for "never".
   */
  end: number | null;
}
