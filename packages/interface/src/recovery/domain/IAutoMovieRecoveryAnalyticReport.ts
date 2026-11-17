import type { IAutoMovieRecoveryAtlasPrimitiveRange } from "../../index";

/**
 * Independent ownership, observation and realization status for one analytic domain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Saved analytic domain identity. Whether this domain's declared ownership was admitted.
 * @evidence contracts/development/design.md#principled-representation Independent ownership, observation and realization status for one analytic domain.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryAnalyticRealization, IAutoMovieRecoveryReconstruction share IAutoMovieRecoveryAnalyticReport's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Producer observation completion independent of engine output.
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
