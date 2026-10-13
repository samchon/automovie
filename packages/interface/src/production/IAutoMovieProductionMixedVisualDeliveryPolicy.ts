import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/** Reviewed policy for every adjacent crossing between unlike visual lanes. */
export interface IAutoMovieProductionMixedVisualDeliveryPolicy {
  /** Protocol version. */
  version: 1;

  /** Current aggregate sequence observation digest. */
  observationDigest: AutoMovieContentDigest;

  /** Exact ordered crossing reviews. */
  transitions: Array<{
    /** Occurrence immediately before the crossing. */
    fromOccurrence: string;

    /** Occurrence immediately after the crossing. */
    toOccurrence: string;

    /** Immutable review receipt digest for this crossing. */
    reviewDigest: AutoMovieContentDigest;
  }>;
}
