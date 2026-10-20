import type { IAutoMovieBicubicAtlasGeometry } from "@automovie/interface";

import type { IAutoMovieRecoveryAnalyticPort } from "./IAutoMovieRecoveryAnalyticPort";
import type { IAutoMovieRecoveryCurveBinding } from "./IAutoMovieRecoveryCurveBinding";
import type { IAutoMovieRecoveryDomainAddress } from "./IAutoMovieRecoveryDomainAddress";
import type { IAutoMovieRecoveryOpenPairAddress } from "./IAutoMovieRecoveryOpenPairAddress";

/**
 * Source-free analytic recipe and its explicitly delegated saved graph occurrences. Finite output does not imply complete observation or source fidelity.
 *
 * @evidence contracts/common.md#principled-implementation Named fields preserve the existing saved coefficient, ownership and observation contract without transformation.
 * @evidence contracts/common.md#clear-and-simple-design This independent record exposes the actual reconstruction input shared by its producer and consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration admits no source mesh, inferred observations or replacement geometry.
 * @evidence contracts/common.md#meaningful-documentation Members state identity, physical units, optional presence and qualification boundaries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Runtime admission and realization own computational reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the records and immutable recipe arrays.
 */
export interface IAutoMovieRecoveryAnalyticDomain {
  /** Unique complex identity, also used by its atlas topology domain. */
  id: string;

  /** Complete analytic coefficients in model metres, including native interval bindings. */
  geometry: IAutoMovieBicubicAtlasGeometry;

  /** Closed graph groups owned by this complex instead of the contour operator. */
  closedGroups: readonly IAutoMovieRecoveryDomainAddress[];

  /** Ordinary open-pair occurrences owned instead of the open continuation operator. */
  openPairs: readonly IAutoMovieRecoveryOpenPairAddress[];

  /** Unresolved open projection groups covered by these supplied domains. */
  openUnresolved: readonly IAutoMovieRecoveryDomainAddress[];

  /** Named lower and upper ports covering every endpoint of a delegated group. */
  ports: readonly IAutoMovieRecoveryAnalyticPort[];

  /** Native saved-curve spans supplying the recipe's canonical atlas authorities. */
  curveBindings: readonly IAutoMovieRecoveryCurveBinding[];

  /** Producer observation completion, independently recorded from geometry realization. */
  observationComplete: boolean;

  /** Missing or unsupported observed domain identities, including when finite charts exist. */
  unrepresentedDomains: readonly string[];
}
