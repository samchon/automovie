import type {
  IAutoMovieRecoveryObservationAnchor,
  IAutoMovieRecoveryObservationProvenance,
  IAutoMovieRecoveryTransportedObservationRow,
} from "../../index";

/**
 * Admitted identity-ordered geometric transport, with interpolation kept
 * explicit.
 */
export interface IAutoMovieRecoveryObservationTransported {
  /** An ordered and representable geometric chart was admitted. */
  admitted: true;

  /** Output row in the retained canonical phase. */
  row: IAutoMovieRecoveryTransportedObservationRow;

  /** Unique identities anchoring incoming phase to current point ordinals. */
  persistentAnchors: IAutoMovieRecoveryObservationAnchor[];

  /**
   * Current input traversal relative to output order: forward +1 or reversed
   * -1.
   */
  direction: 1 | -1;

  /** True when one interpolated PL-edge point supplies the canonical seam. */
  virtualSeam: boolean;

  /** Same-order origin of every output row point. */
  provenance: IAutoMovieRecoveryObservationProvenance[];

  /** Number of points in the original current input cycle. */
  originalObservationCount: number;

  /** Whether every original current-cycle point remains in the output. */
  originalPointsRetained: boolean;

  /** Geometric anchor ordering does not establish material motion. */
  materialCorrespondenceQualified: false;

  /** This operation observes no longitudinal source guide. */
  sourceGuideQualified: false;
}
