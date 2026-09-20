import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * Reviewed policy for every adjacent crossing between unlike visual lanes.
 *
 * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-mixed-delivery Binds each actual lane crossing to the current aggregate observation.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-structure-continuity Makes transition review versioned and occurrence-addressed.
 */
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
