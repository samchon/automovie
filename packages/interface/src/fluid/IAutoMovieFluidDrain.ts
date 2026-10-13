/**
 * One declared outflow from a single cell.
 *
 * `validateFluidDomain` requires the cell to lie inside the lattice and not be
 * solid, the `id` to be non-blank and unique among the domain's drains, and the
 * numbers to be finite. Removed volume accumulates in
 * `IAutoMovieFluidState.drainVolume`.
 *
 * @evidence contracts/common.md#principled-implementation `simulateFluidDomain` adds `flowRate * dt` to the cell's outgoing volume for each step whose start time lies in `[start, end)` and whose step-start free surface stands above `sillLevel`, then lets the positivity limiter scale drain and face outflows together so depth never goes negative.
 * @evidence contracts/common.md#clear-and-simple-design A single-cell point outflow with a rate cap, a sill and a time window covers floor drains, overflow weirs and timed returns without a pump or pipe model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The drain removes only water the cell holds, through the same limiter as face fluxes, and its removal is recorded in the ledger rather than deleted silently.
 * @evidence contracts/common.md#meaningful-documentation States the validation rules and where removed volume is counted; members give units, index ranges, how the realized rate is limited, the sill comparison and the half-open activity window.
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
   * Free-surface elevation in metres above `grid.origin.y` at or below which
   * the drain is closed: the sill of an overflow weir, or the bed elevation for
   * a plain floor drain. The drain runs during a step only while the cell's
   * `bed + depth` at the step's start stands strictly above it.
   */
  sillLevel: number;

  /**
   * Domain-clock second at which the drain opens; `>= 0`. A step drains when
   * its start time `t` satisfies `start <= t < end`.
   */
  start: number;

  /**
   * Domain-clock second at which it closes, strictly after `start`, or `null`
   * for never.
   */
  end: number | null;
}
