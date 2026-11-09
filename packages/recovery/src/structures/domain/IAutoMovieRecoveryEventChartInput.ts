import type { IAutoMovieRecoveryEventChart } from "./IAutoMovieRecoveryEventChart";

/**
 * Four named, oriented cubic paths bound one source-free Coons domain.
 * Periodic topology identifies the two explicit seam occurrences; it does not
 * impose a horizontal station or authorize material correspondence.
 *
 * @evidence contracts/development/design.md#principled-representation Ordered cubic occurrences and exact corner authority define the four boundary functions used by a Coons interpolant.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The domain record carries geometry and direction; observation provenance, graph ownership and finite compiler budgets belong to their callers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source polygons, mesh fallback, proximity attachment or inferred normal field enters this consumer input.
 * @evidence contracts/development/common.md#meaningful-documentation Boundary controls use millimetres and retain native phase; winding changes chart orientation independently of source-fit qualification.
 */
export interface IAutoMovieRecoveryEventChartInput {
  /** Stable nonempty domain name, used as a prefix for actual patch IDs. */
  id: string;

  /** Four paths in increasing local side parameter, with exact meeting corners. */
  chart: IAutoMovieRecoveryEventChart;

  /** Explicit final chart orientation; this does not infer an outward material side. */
  winding: 1 | -1;
}
