import type { IAutoMovieRecoveryAtlasPrimitiveRange } from "./IAutoMovieRecoveryAtlasPrimitiveRange";

/**
 * Independent ownership, observation and realization status for one analytic domain.
 *
 * @evidence contracts/common.md#principled-implementation Named fields retain the existing producer's quantities, units and independent qualifications.
 * @evidence contracts/common.md#clear-and-simple-design This shared structural contract names the actual operation result without deriving it from a function signature.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration supplies no inferred observation, geometry or fallback.
 * @evidence contracts/common.md#meaningful-documentation Members document quantity, ownership, optional-state and qualification meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased interface performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns returned records and arrays; the type acquires no resources.
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
