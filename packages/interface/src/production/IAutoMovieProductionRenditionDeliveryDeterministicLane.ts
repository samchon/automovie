import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * The deterministic renderer lane of one delivered occurrence.
 *
 * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-mixed-delivery Makes the deterministic lane explicit rather than inferred from absent repaint data.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-failure-publication Refuses receipt-based lane inference for deterministic pixels.
 */
export interface IAutoMovieProductionRenditionDeliveryDeterministicLane {
  /**
   * Deterministic renderer source, unaffected by resident repaint data.
   * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-mixed-delivery Makes the lane explicit.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-failure-publication Refuses receipt-based inference.
   */
  lane: "deterministic";

  /** Current deterministic feature source digest. */
  sourceDigest: AutoMovieContentDigest;

  /**
   * No repaint lineage belongs to this lane.
   *
   * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-publication-gate Records that no selected repaint lineage exists for deterministic pixels.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-failure-publication Seals the absence of a candidate receipt in final conform.
   */
  receiptDigest: null;

  /** No active selection belongs to this lane. */
  selectionDigest: null;
}
