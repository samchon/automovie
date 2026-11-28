/** Raw clipping corner or cut-edge crossing with separate joining identity. */
export interface IAutoMovieRecoverySourceCellNode {
  /** Raw original vertex or source-edge crossing key. */
  id: string;

  /** Raw or canonical joining key under the prepared incidence policy. */
  incidenceId: string;

  /** Original source vertex address or the two endpoints of the cut source edge. */
  vertices: readonly number[];

  /** Registered axis height of the corner or crossing, in millimetres. */
  scalar: number;
}
