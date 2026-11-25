/**
 * Authored policy naming every adjacent crossing between unlike visual lanes
 * and the current aggregate sequence observation.
 */
export interface IAutoMovieProductionMixedVisualDeliveryPolicy {
  /** Protocol version. */
  version: 1;

  /** Current aggregate sequence observation digest. */
  observationDigest: string;

  /** Authored review references in the exact ordered crossing population. */
  transitions: Array<{
    /** Occurrence immediately before the crossing. */
    fromOccurrence: string;

    /** Occurrence immediately after the crossing. */
    toOccurrence: string;

    /**
     * Authored review digest; this declaration neither validates syntax nor
     * resolves a crossing-review receipt.
     */
    reviewDigest: string;
  }>;
}
