/**
 * One declared inflow into a single cell.
 *
 * ValidateFluidDomain requires a nonsolid in-grid cell, a nonblank id unique
 * among sources and finite authored numbers. simulateFluidDomain accumulates
 * admitted flow in sourceVolume without capping it to current or design depth;
 * derived accumulation limits remain those of IAutoMovieFluidState.
 */
export interface IAutoMovieFluidSource {
  /** Stable source identity within the domain. */
  id: string;

  /** Cell column receiving the water; `0 <= column < grid.columns`. */
  column: number;

  /** Cell row receiving the water; `0 <= row < grid.rows`. */
  row: number;

  /**
   * Finite nonnegative inflow in cubic metres per second. Each active step
   * requests the full flowRate * dt regardless of current depth; use a drain
   * for outflow.
   */
  flowRate: number;

  /**
   * Nonnegative domain-clock start second; a step receives water when its start
   * time satisfies start <= t < end.
   */
  start: number;

  /** End second strictly after start, or null for no end. */
  end: number | null;
}
