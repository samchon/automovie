import type { IAutoMovieRecoveryEventCompilationPolicy } from "../../index";

/**
 * Local chart budgets and aggregate field-complex admission limits.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Positive safe-integer limit on admitted chart declarations. Positive safe-integer limit on native coefficient owners.
 * @evidence contracts/development/design.md#principled-representation Positive safe-integer limit on admitted chart declarations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface assembleAutoMovieRecoveryFieldComplex share IAutoMovieRecoveryFieldComplexPolicy's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryFieldComplexPolicy extends IAutoMovieRecoveryEventCompilationPolicy {
 
 /** Positive safe-integer limit on admitted chart declarations. */
  maxCharts: number;

 
 /** Positive safe-integer limit on native coefficient owners. */
  maxNativeOwners: number;

 
 /** Positive safe-integer aggregate patch budget. */
  maxTotalPatches: number;
}
