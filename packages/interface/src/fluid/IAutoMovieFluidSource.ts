/**
 * One declared inflow into a single cell.
 *
 * validateFluidDomain requires a nonsolid in-grid cell, a nonblank id unique among sources and finite authored numbers. simulateFluidDomain accumulates admitted flow in sourceVolume without capping it to current or design depth; derived accumulation limits remain those of IAutoMovieFluidState.
 *
 * @evidence contracts/common.md#principled-implementation For each active step start in [start, end), simulateFluidDomain adds flowRate * dt to the cell update and the source ledger. The same contribution targets finite-arithmetic volume balance; authored-field finiteness alone does not prove finite products or cumulative totals.
 * @evidence contracts/common.md#clear-and-simple-design A single-cell constant-rate inflow with a time window covers taps, jets and supply ports, and `lowerWetZoneDrainage` produces these records from service-network supply ports without a second flow model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No current-depth or referenceDepth cap discards authored inflow. Rising beyond the stability design depth and nonfinite derived ledger arithmetic remain the solver/state types' documented limits rather than a universal conservation guarantee.
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
   * Finite nonnegative inflow in cubic metres per second. Each active step requests the full flowRate * dt regardless of current depth; use a drain for outflow.
   */
  flowRate: number;

  /**
   * Nonnegative domain-clock start second; a step receives water when its start time satisfies start <= t < end.
   */
  start: number;

  /**
   * End second strictly after start, or null for no end.
   */
  end: number | null;
}
