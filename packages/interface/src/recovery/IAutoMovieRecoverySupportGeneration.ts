/**
 * Numerical generation record for an open convex-support loft. The counts
 * describe the Engine plan and emitted mesh, while the defect records agreement
 * at reused boundary positions.
 */
export interface IAutoMovieRecoverySupportGeneration {
  /**
   * Total retained feasible interior event stations across the polynomial
   * spans, excluding span endpoints.
   */
  events: number;

  /**
   * Total adjacent event-station intervals across the polynomial spans,
   * including intervals bounded by span endpoints.
   */
  intervals: number;

  /**
   * Number of emitted render vertices, counted as triples in the mesh position
   * array.
   */
  vertices: number;

  /**
   * Largest Euclidean discrepancy in metres between repeated evaluations of a
   * shared canonical boundary vertex.
   */
  maximumBoundaryDefectMeters: number;
}
