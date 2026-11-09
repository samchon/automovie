import type { AutoMovieRecoveryObservationProvenance } from "../../typings/AutoMovieRecoveryObservationProvenance";
import type { IAutoMovieRecoveryObservationAnchor } from "./IAutoMovieRecoveryObservationAnchor";
import type { IAutoMovieRecoveryTransportedObservationRow } from "./IAutoMovieRecoveryTransportedObservationRow";

/**
 * Admitted identity-ordered geometric transport, with interpolation kept explicit.
 *
 * @evidence contracts/development/design.md#principled-representation The transported row, persistent anchors, traversal direction and per-point provenance preserve the incoming geometric phase authority.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One admitted result groups the row with the evidence needed to interpret transport and its limitations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Admission explicitly does not qualify material correspondence or a longitudinal source guide.
 * @evidence contracts/development/common.md#meaningful-documentation Defines point counts, orientation, virtual seam, retained observations and false qualification claims.
 */
export interface IAutoMovieRecoveryObservationTransported {
  /** An ordered and representable geometric chart was admitted. */
  admitted: true;

  /** Output row in the retained canonical phase. */
  row: IAutoMovieRecoveryTransportedObservationRow;

  /** Unique identities anchoring incoming phase to current point ordinals. */
  persistentAnchors: IAutoMovieRecoveryObservationAnchor[];

  /** Current input traversal relative to output order: forward +1 or reversed -1. */
  direction: 1 | -1;

  /** True when one interpolated PL-edge point supplies the canonical seam. */
  virtualSeam: boolean;

  /** Same-order origin of every output row point. */
  provenance: AutoMovieRecoveryObservationProvenance[];

  /** Number of points in the original current input cycle. */
  originalObservationCount: number;

  /** Whether every original current-cycle point remains in the output. */
  originalPointsRetained: boolean;

  /** Geometric anchor ordering does not establish material motion. */
  materialCorrespondenceQualified: false;

  /** This operation observes no longitudinal source guide. */
  sourceGuideQualified: false;
}
