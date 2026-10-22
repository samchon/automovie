import type { IAutoMovieRecoverySourceLineage } from "../observation/IAutoMovieRecoverySourceLineage";
import type { IAutoMovieRecoverySections } from "./IAutoMovieRecoverySections";

/** Caller-bound publication identities for one previously observed physical cut.
 * Coefficients are deliberately absent. The caller verifies the source bytes,
 * registration, selected original ordinal space and saved artifact commitment;
 * matching opaque identities here is not a cryptographic verification. Slab
 * observation independently recuts the source and verifies contour ordinals,
 * address sets and admitted closure. It does not verify a named curve's shape,
 * parameterization, direction, error, degree, rational weights or material phase.
 *
 * @evidence contracts/common.md#principled-implementation One normalized frame, alias policy and complete raw-contour lineage population identify the deterministic source cut independently of any fitting basis. Caller identities bind external artifacts without pretending to recompute their hashes from registered arrays.
 * @evidence contracts/common.md#clear-and-simple-design One public type groups exactly the saved evidence required by slab-only observation; no curve coefficient, fitting budget or reconstruction override is admitted.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Opaque identities do not elevate caller-supplied curves to observed geometry. Broad incidence remains broad; newly recut exact segment provenance supplies ports while original curve references remain caller-attested.
 * @evidence contracts/common.md#meaningful-documentation Documents millimetre coordinates, immutable original source ordinals, caller hash/registration/selection responsibilities, complete contour coverage and the limits of raw-cut verification.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased contract performs no observation or hashing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record owns no cache or fitting operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns saved records and their artifact lifetime.
 */
export interface IAutoMovieRecoverySavedSection {
  /** Signed millimetres along the saved frame's normalized n from its origin. */
  coordinateMm: number;

  /** Opaque original-byte identity already verified by the caller, typically SHA-256. */
  sourceIdentity: string;

  /** Caller-verified selection and registration identity, including original triangle ordering. */
  sourceSelectionIdentity: string;

  /** Caller-verified byte identity of the saved artifact containing these publications. */
  observationIdentity: string;

  /** Original zero-origin normalized physical frame, compared componentwise without snapping. */
  frame: IAutoMovieRecoverySections["frame"];

  /** Original exact-position alias policy; changing it changes source contour incidence. */
  exactCoordinateAliases: boolean;

  /** Every original raw contour, including failed and degenerate publications. Ordinals and broad face sets are required; optional saved exact sets are also compared with the recut. */
  sourceLineage: readonly IAutoMovieRecoverySourceLineage[];
}
