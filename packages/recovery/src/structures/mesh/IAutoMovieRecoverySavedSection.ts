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
 * @evidence contracts/development/design.md#principled-representation One normalized frame, alias policy and complete raw-contour lineage population identify the deterministic source cut independently of any fitting basis. Caller identities bind external artifacts without pretending to recompute their hashes from registered arrays.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One public type groups exactly the saved evidence required by slab-only observation; no curve coefficient, fitting budget or reconstruction override is admitted.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Opaque identities do not elevate caller-supplied curves to observed geometry. Broad incidence remains broad; newly recut exact segment provenance supplies ports while original curve references remain caller-attested.
 * @evidence contracts/development/common.md#meaningful-documentation Documents millimetre coordinates, immutable original source ordinals, caller hash/registration/selection responsibilities, complete contour coverage and the limits of raw-cut verification.
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
