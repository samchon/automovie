import type { IAutoMovieRecoveryAtlasPrimitiveRange } from "../../index";

/**
 * Independent ownership, observation and realization status for one analytic
 * domain.
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
