import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * The lane-independent identity of one exact delivered occurrence.
 *
 * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-mixed-delivery Preserves one explicit occurrence and its source provenance.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-failure-publication Types the exact final-conform occurrence join.
 */
export interface IAutoMovieProductionRenditionDeliveryOccurrence {
  /**
   * Stable timeline occurrence identity.
   * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-mixed-delivery Keeps repeated shot labels distinct.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-failure-publication Supplies the exact final-conform join key.
   */
  occurrence: string;
  /**
   * Exact compiled shot id.
   *
   * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-mixed-delivery Identifies the shot behind this exact occurrence.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-failure-publication Binds delivery provenance to its compiled shot.
   */
  shot: string;
  /**
   * Render-root-relative immutable visual source.
   *
   * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-mixed-delivery Keeps the chosen lane source explicit.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-failure-publication Names the exact source consumed by final conform.
   */
  path: string;
  /**
   * Exact current visual source digest.
   *
   * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-mixed-delivery Prevents a lane source from changing after review.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-failure-publication Seals the conformed source bytes.
   */
  digest: AutoMovieContentDigest;
}
