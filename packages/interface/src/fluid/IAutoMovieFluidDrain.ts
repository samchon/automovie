/**
 * One declared outflow from a single cell.
 *
 * The cell must lie inside the lattice and not be solid, and the `id` must be
 * non-blank and unique among the domain's drains. Removed volume accumulates in
 * `IAutoMovieFluidState.drainVolume`.
 *
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
