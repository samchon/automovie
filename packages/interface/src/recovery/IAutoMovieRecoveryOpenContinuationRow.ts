import type { IAutoMovieRecoveryOpenArcIncidence } from "./IAutoMovieRecoveryOpenArcIncidence";

/**
 * One observed section's matched open incidence and unmatched saved curve
 * addresses.
 */
export interface IAutoMovieRecoveryOpenContinuationRow {
  /** Endpoint and face incidence for raw cuts bound to saved open arcs. */
  arcs: IAutoMovieRecoveryOpenArcIncidence[];

  /** Saved open-curve ordinal for each corresponding arcs entry. */
  ordinals: number[];

  /**
   * Saved open-curve indices without an identical endpoint-bound source
   * observation.
   */
  missing: number[];

  /** Original source face sets for unsupported raw contours. */
  defects: Set<number>[];
}
