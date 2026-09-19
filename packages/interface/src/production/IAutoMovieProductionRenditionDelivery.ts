import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieProductionRenditionDeliveryShot } from "./IAutoMovieProductionRenditionDeliveryShot";
import { IAutoMovieRepaintSequenceObservation } from "./IAutoMovieRepaintSequenceObservation";

/**
 * Review and receipt provenance for one repainted feature delivery.
 *
 * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-publication-gate Seals the current member set and aggregate observation into final delivery.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-failure-publication Types the portable readback provenance boundary.
 */
export interface IAutoMovieProductionRenditionDelivery {
  /** Versioned occurrence-lane provenance protocol. */
  version: 2;

  /**
   * Versioned explicit visual-lane provenance kind.
   *
   * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-publication-gate Prevents older inferred-rendition manifests from masquerading as explicit delivery.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-failure-publication Discriminates the occurrence-lane readback protocol.
   */
  kind: "visual-lanes";

  /** Digest of the canonical ordered occurrence-member population. */
  memberSetDigest: AutoMovieContentDigest;

  /** Current passing aggregate sequence observation, null for all-deterministic. */
  observationDigest: AutoMovieContentDigest | null;

  /** Full observation needed for parser-only readback, null for all-deterministic. */
  observation: IAutoMovieRepaintSequenceObservation | null;

  /**
   * Every visual occurrence consumed by the current film timeline.
   *
   * @evidence requirements/repaint/sequence-continuity-and-publication.md#repaint-mixed-delivery Requires complete ordered lane membership.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-failure-publication Preserves the exact final-conform population.
   */
  shots: IAutoMovieProductionRenditionDeliveryShot[];
}
