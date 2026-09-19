import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * The selected-repaint lane of one delivered occurrence.
 *
 * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-mixed-delivery Makes the repainted lane and its selection explicit.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-failure-publication Types the selected candidate provenance final conform consumes.
 */
export interface IAutoMovieProductionRenditionDeliveryRepaintedLane {
  /** Explicit selected repaint source. */
  lane: "repainted";

  /** Candidate output digest, repeated as the exact source identity. */
  sourceDigest: AutoMovieContentDigest;

  /**
   * Digest of the canonical immutable candidate receipt.
   *
   * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-publication-gate Preserves that selected repaint lineage exists.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-failure-publication Seals the candidate receipt consumed by final conform.
   */
  receiptDigest: AutoMovieContentDigest;

  /** Digest of the active immutable selection record. */
  selectionDigest: AutoMovieContentDigest;

  /** Stable active selection identity. */
  selectionId: string;

  /** Immutable request identity. */
  requestId: string;

  /** Immutable successful attempt identity. */
  attemptId: string;
}
