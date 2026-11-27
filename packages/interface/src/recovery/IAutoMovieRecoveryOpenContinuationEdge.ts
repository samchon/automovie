import type { IAutoMovieRecoveryOpenArcAddress } from "..";

/**
 * Admitted directed continuation between open arcs of adjacent saved sections.
 * before/after retain saved arc addresses, reverse is the explicit endpoint
 * orientation witness, and pairOrdinal addresses the original interval pair
 * list even when analytic ownership excludes other pairs.
 */
export type IAutoMovieRecoveryOpenContinuationEdge = {
  /** Saved arc address in the earlier of the two adjacent sections. */
  before: IAutoMovieRecoveryOpenArcAddress;

  /** Saved arc address in the later adjacent section. */
  after: IAutoMovieRecoveryOpenArcAddress;

  /** Whether the matched continuation reverses the after-curve's saved order. */
  reverse: boolean;

  /** Original pair ordinal within the earlier section's continuation interval. */
  pairOrdinal: number;
};
