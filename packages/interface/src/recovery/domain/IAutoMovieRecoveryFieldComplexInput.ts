import type { IAutoMovieRecoveryEventChartInput, IAutoMovieRecoveryUnsupportedDomain } from "../../index";

/**
 * Named source-free charts and the producer's observation coverage.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Nonempty topology domain for the assembled atlas. Caller-owned chart declarations in admission order.
 * @evidence contracts/development/design.md#principled-representation Named source-free charts and the producer's observation coverage.
 * @evidence contracts/development/design.md#minimal-and-owned-surface assembleAutoMovieRecoveryFieldComplex share IAutoMovieRecoveryFieldComplexInput's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Previously omitted observations and their original causes.
 */

export interface IAutoMovieRecoveryFieldComplexInput {
 
 /** Nonempty topology domain for the assembled atlas. */
  id: string;

 
 /** Caller-owned chart declarations in admission order. */
  charts: readonly IAutoMovieRecoveryEventChartInput[];

 
 /** Previously omitted observations and their original causes. */
  unsupported?: readonly IAutoMovieRecoveryUnsupportedDomain[];

 
 /** Producer observation completion independent of coefficient assembly. */
  observationComplete: boolean;
}
