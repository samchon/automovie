/**
 * Finite patch and realization budgets for one local cubic-boundary chart.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Positive integer maximum bicubic patches. Positive integer maximum realization cells.
 * @evidence contracts/development/design.md#principled-representation Positive integer maximum bicubic patches.
 * @evidence contracts/development/design.md#minimal-and-owned-surface compileAutoMovieRecoveryEventDomain, compileAutoMovieRecoveryNativeNamedChart share IAutoMovieRecoveryEventCompilationPolicy's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryEventCompilationPolicy {
 
 /** Positive integer maximum bicubic patches. */
  maxPatches: number;

 
 /** Positive integer maximum realization cells. */
  maxCells: number;

 
 /** Positive integer maximum realization vertices. */
  maxVertices: number;

 
 /** Positive physical chord tolerance, millimetres. */
  toleranceMm: number;

 
 /** When true, external chart endpoints are evaluated from their declared native parents. */
  nativeParentBindings?: boolean;
}
