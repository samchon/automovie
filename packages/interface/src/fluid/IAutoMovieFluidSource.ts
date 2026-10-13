/** One declared inflow into a single cell. */
export interface IAutoMovieFluidSource {
  /** Stable source identity within the domain. */
  id: string;

  /** Cell column receiving the water; `0 <= column < grid.columns`. */
  column: number;

  /** Cell row receiving the water; `0 <= row < grid.rows`. */
  row: number;

  /** Volumetric inflow in m³/s; must be `>= 0`. Use a drain to remove water. */
  flowRate: number;

  /** Domain-clock second at which the source starts; finite and `>= 0`. */
  start: number;

  /** Domain-clock second at which it stops, or `null` for "never". */
  end: number | null;
}
