import type { IAutoMovieRecoveryEventChart } from "..";

/**
 * Four named, oriented cubic paths bound one source-free Coons domain. Periodic
 * topology identifies the two explicit seam occurrences; it does not impose a
 * horizontal station or authorize material correspondence.
 */
export interface IAutoMovieRecoveryEventChartInput {
  /** Stable nonempty domain name, used as a prefix for actual patch IDs. */
  id: string;

  /** Four paths in increasing local side parameter, with exact meeting corners. */
  chart: IAutoMovieRecoveryEventChart;

  /**
   * Explicit final chart orientation; this does not infer an outward material
   * side.
   */
  winding: 1 | -1;
}
