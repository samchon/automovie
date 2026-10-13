/**
 * One declared inflow into a single cell.
 *
 * The cell must lie inside the lattice and not be solid, and the `id` must be
 * non-blank and unique among the domain's sources. Added volume accumulates in
 * `IAutoMovieFluidState.sourceVolume`.
 *
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
