/**
 * Unfitted chart population reported by inventory-only atlas observation.
 * Chart/component identities and vertex, triangle and boundary-observation counts describe the candidate population; feature distinguishes crease-derived candidates. Counts require producer validation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Unfitted chart population reported by inventory-only atlas observation. Chart/component identities and vertex, triangle and boundary-observation counts describe the candidate population; feature distinguishes crease-derived candidates. Counts require producer validation.
 * @evidence contracts/development/design.md#principled-representation Chart/component identities and vertex, triangle and boundary-observation counts describe the candidate population; feature distinguishes crease-derived candidates. Counts require producer validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Both ordinary and feature chart preparation publish this same inventory record without fitting or allocating coefficient authority.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Inventory counts establish neither reconstructability nor tolerance qualification and retain unsupported chart evidence elsewhere in the ledger.
 */
export type IAutoMovieRecoveryChartInventory = {
  /** Stable identity of the observed or prepared chart. */
  chart: string;

  /** One observed source-cell component with independent topology qualification. */
  component: string;

  /** Actual vertex population of this generated run or observed component. */
  vertices: number;

  /** Actual triangle population of this generated run or observed component. */
  triangles: number;

  /** Number of source-boundary point observations assigned to the chart. */
  boundaryObservations: number;

  /** Whether this inventory entry represents a chart split along an admitted source crease. */
  feature: boolean;
};
