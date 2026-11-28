/**
 * Unfitted source chart inventory with observed component and population
 * counts.
 */
export type IAutoMovieRecoveryChartInventory = {
  /** Candidate chart ID in the source observation inventory. */
  chart: string;

  /** Parent chart name derived from source interval and component identity. */
  component: string;

  /** Source vertex count for the candidate chart. */
  vertices: number;

  /** Source triangle count for the candidate chart. */
  triangles: number;

  /** Sum of ordered side observation counts, including repeated corners. */
  boundaryObservations: number;

  /** Whether an admitted crease supplied this chart candidate. */
  feature: boolean;
};
