/**
 * One declared inflow into a single cell.
 *
 * `validateFluidDomain` requires the cell to lie inside the lattice and not be
 * solid, the `id` to be non-blank and unique among the domain's sources, and
 * the numbers to be finite. Added volume accumulates in
 * `IAutoMovieFluidState.sourceVolume`.
 *
 * @evidence contracts/common.md#principled-implementation `simulateFluidDomain` adds `flowRate * dt` to the cell's continuity update for each step whose start time lies in `[start, end)`, and sums the same amount into the source ledger, so the volume balance holds by construction.
 * @evidence contracts/common.md#clear-and-simple-design A single-cell constant-rate inflow with a time window covers taps, jets and supply ports, and `lowerWetZoneDrainage` produces these records from service-network supply ports without a second flow model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inflow is never capped by depth or design depth, so the solver neither invents nor discards water; the consequence that a cell can rise past `referenceDepth` is stated on the solver settings.
 * @evidence contracts/common.md#meaningful-documentation States the validation rules and where added volume is counted; members give units, index ranges, that the full amount arrives however deep the cell is, and the half-open activity window.
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
   * Volumetric inflow in m³/s; must be `>= 0`, and a drain removes water. The
   * full `flowRate * dt` is added at every active step, however deep the cell
   * already is.
   */
  flowRate: number;

  /**
   * Domain-clock second at which the source starts; `>= 0`. A step receives
   * water when its start time `t` satisfies `start <= t < end`.
   */
  start: number;

  /**
   * Domain-clock second at which it stops, strictly after `start`, or `null`
   * for never.
   */
  end: number | null;
}
