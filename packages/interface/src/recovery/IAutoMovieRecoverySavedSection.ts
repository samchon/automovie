import type {
  IAutoMovieRecoverySections,
  IAutoMovieRecoverySourceLineage,
} from "..";

/**
 * Caller-bound publication identities for one previously observed physical cut.
 * Coefficients are deliberately absent. The caller verifies the source bytes,
 * registration, selected original ordinal space and saved artifact commitment;
 * matching opaque identities here is not a cryptographic verification. Slab
 * observation independently recuts the source and verifies contour ordinals,
 * address sets and admitted closure. It does not verify a named curve's shape,
 * parameterization, direction, error, degree, rational weights or material
 * phase.
 */
export interface IAutoMovieRecoverySavedSection {
  /** Signed millimetres along the saved frame's normalized n from its origin. */
  coordinateMm: number;

  /**
   * Opaque original-byte identity already verified by the caller, typically
   * SHA-256.
   */
  sourceIdentity: string;

  /**
   * Caller-verified selection and registration identity, including original
   * triangle ordering.
   */
  sourceSelectionIdentity: string;

  /**
   * Caller-verified byte identity of the saved artifact containing these
   * publications.
   */
  observationIdentity: string;

  /**
   * Original zero-origin normalized physical frame, compared componentwise
   * without snapping.
   */
  frame: IAutoMovieRecoverySections["frame"];

  /**
   * Original exact-position alias policy; changing it changes source contour
   * incidence.
   */
  exactCoordinateAliases: boolean;

  /**
   * Every original raw contour, including failed and degenerate publications.
   * Ordinals and broad face sets are required; optional saved exact sets are
   * also compared with the recut.
   */
  sourceLineage: readonly IAutoMovieRecoverySourceLineage[];
}
