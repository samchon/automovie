import type {
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieRecoveryAnalyticPort,
  IAutoMovieRecoveryCurveBinding,
  IAutoMovieRecoveryDomainAddress,
  IAutoMovieRecoveryOpenPairAddress,
} from "../../index";

/**
 * Source-free analytic recipe and its explicitly delegated saved graph
 * occurrences. Finite output does not imply complete observation or source
 * fidelity.
 */

export interface IAutoMovieRecoveryAnalyticDomain {
  /** Unique complex identity, also used by its atlas topology domain. */
  id: string;

  /**
   * Complete analytic coefficients in model metres, including native interval
   * bindings.
   */
  geometry: IAutoMovieBicubicAtlasGeometry;

  /** Closed graph groups owned by this complex instead of the contour operator. */
  closedGroups: readonly IAutoMovieRecoveryDomainAddress[];

  /**
   * Ordinary open-pair occurrences owned instead of the open continuation
   * operator.
   */
  openPairs: readonly IAutoMovieRecoveryOpenPairAddress[];

  /** Unresolved open projection groups covered by these supplied domains. */
  openUnresolved: readonly IAutoMovieRecoveryDomainAddress[];

  /** Named lower and upper ports covering every endpoint of a delegated group. */
  ports: readonly IAutoMovieRecoveryAnalyticPort[];

  /**
   * Native saved-curve spans supplying the recipe's canonical atlas
   * authorities.
   */
  curveBindings: readonly IAutoMovieRecoveryCurveBinding[];

  /**
   * Producer observation completion, independently recorded from geometry
   * realization.
   */
  observationComplete: boolean;

  /**
   * Missing or unsupported observed domain identities, including when finite
   * charts exist.
   */
  unrepresentedDomains: readonly string[];
}
