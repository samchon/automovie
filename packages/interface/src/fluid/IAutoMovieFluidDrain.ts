/**
 * One declared outflow from a single cell.
 *
 * ValidateFluidDomain requires a nonsolid in-grid cell, a nonblank id unique
 * among drains and finite authored numbers. The solver limits requested
 * drain/face outflows against held water and records drainVolume; nonfinite
 * intermediate and ledger handling retains IAutoMovieFluidState's documented
 * gaps.
 */
export interface IAutoMovieFluidDrain {
  /** Stable drain identity within the domain. */
  id: string;

  /** Cell column the water leaves from; `0 <= column < grid.columns`. */
  column: number;

  /** Cell row the water leaves from; `0 <= row < grid.rows`. */
  row: number;

  /**
   * Finite nonnegative requested maximum outflow in cubic metres per second.
   * When requested drain and outgoing-face volumes exceed held water, the
   * solver scales them by one factor; the documented intermediate-arithmetic
   * limits still apply.
   */
  flowRate: number;

  /**
   * Free-surface threshold in metres above grid.origin.y, such as an overflow
   * sill or floor-drain bed elevation. A step drains only when its initial bed
   * + depth is strictly above the threshold.
   */
  sillLevel: number;

  /**
   * Nonnegative domain-clock opening second; a step drains when its start time
   * satisfies start <= t < end.
   */
  start: number;

  /** Closing second strictly after start, or null for no close. */
  end: number | null;
}
