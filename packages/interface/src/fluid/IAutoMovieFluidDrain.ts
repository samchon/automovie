/**
 * One declared outflow from a single cell.
 *
 * validateFluidDomain requires a nonsolid in-grid cell, a nonblank id unique among drains and finite authored numbers. The solver limits requested drain/face outflows against held water and records drainVolume; nonfinite intermediate and ledger handling retains IAutoMovieFluidState's documented gaps.
 *
 * @evidence contracts/common.md#principled-implementation Active steps request flowRate * dt when the step-start free surface exceeds sillLevel, then share one donor scaling factor with outgoing faces. For finite representable arithmetic that factor bounds removal by held water; overflowed requests and NaN ledger values are not independently admitted by this type or fully rejected by the current integrator.
 * @evidence contracts/common.md#clear-and-simple-design A single-cell point outflow with a rate cap, a sill and a time window covers floor drains, overflow weirs and timed returns without a pump or pipe model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Drain and face fluxes share the same held-volume limiter and ledger path, without a drain-specific depth clamp. An overflowed request can produce a NaN scaled removal, so the current implementation does not establish the intended bounded-removal identity for every finite authored rate.
 * @evidence contracts/common.md#meaningful-documentation States the validation rules and where removed volume is counted; members give units, index ranges, how the realized rate is limited, the sill comparison and the half-open activity window.
 */
export interface IAutoMovieFluidDrain {
  /** Stable drain identity within the domain. */
  id: string;

  /** Cell column the water leaves from; `0 <= column < grid.columns`. */
  column: number;

  /** Cell row the water leaves from; `0 <= row < grid.rows`. */
  row: number;

  /**
   * Finite nonnegative requested maximum outflow in cubic metres per second. When requested drain and outgoing-face volumes exceed held water, the solver scales them by one factor; the documented intermediate-arithmetic limits still apply.
   */
  flowRate: number;

  /**
   * Free-surface threshold in metres above grid.origin.y, such as an overflow sill or floor-drain bed elevation. A step drains only when its initial bed + depth is strictly above the threshold.
   */
  sillLevel: number;

  /**
   * Nonnegative domain-clock opening second; a step drains when its start time satisfies start <= t < end.
   */
  start: number;

  /**
   * Closing second strictly after start, or null for no close.
   */
  end: number | null;
}
