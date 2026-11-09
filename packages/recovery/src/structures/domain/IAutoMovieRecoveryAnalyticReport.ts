import type { IAutoMovieRecoveryAtlasPrimitiveRange } from "./IAutoMovieRecoveryAtlasPrimitiveRange";

/**
 * Independent ownership, observation and realization status for one analytic domain.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields retain the existing producer's quantities, units and independent qualifications.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This shared structural contract names the actual operation result without deriving it from a function signature.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration supplies no inferred observation, geometry or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members document quantity, ownership, optional-state and qualification meaning.
 */
export interface IAutoMovieRecoveryAnalyticReport {
  /** Saved analytic domain identity. */
  id: string;

  /** Whether this domain's declared ownership was admitted. */
  admitted: boolean;

  /** Whether the requested admitted patch domain was retained. */
  complete: boolean;

  /** Whether retained output met its approximation bound. */
  approximationQualified: boolean;

  /** Producer observation completion independent of engine output. */
  observationComplete: boolean;

  /** Observed domains that remain omitted or unsupported. */
  unrepresentedDomains: readonly string[];

  /** Admission or engine causes retained for this domain. */
  diagnostics: string[];

  /** Retained triangle intervals and generating patch bounds. */
  primitiveRanges: IAutoMovieRecoveryAtlasPrimitiveRange[];
}
