import type { AutoMovieVector3Tuple, IAutoMovieRecoveryChartBoxSolve, IAutoMovieRecoveryChartFit, IAutoMovieRecoveryChartFitPrepare, IAutoMovieRecoveryChartFitSystem } from "../../index";



/**
 * Solve the normalized box problem and reconstruct the original coefficient registry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lower componentwise control bound in the normalized solver chart. Upper componentwise control bound in the normalized solver chart.
 * @evidence contracts/development/design.md#principled-representation Lower componentwise control bound in the normalized solver chart.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryChartFit, RecoveryChartFitReport, RecoveryChartFitSolve share IAutoMovieRecoveryChartFitSolve's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical box-solver output retained with its actual termination and objective diagnostics.
 */

export namespace IAutoMovieRecoveryChartFitSolve {
/**
 * Solve the normalized box problem and reconstruct the original coefficient registry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lower componentwise control bound in the normalized solver chart. Upper componentwise control bound in the normalized solver chart.
 * @evidence contracts/development/design.md#principled-representation Lower componentwise control bound in the normalized solver chart.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryChartFit, RecoveryChartFitReport, RecoveryChartFitSolve share IAutoMovieRecoveryChartFitSolve's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical box-solver output retained with its actual termination and objective diagnostics.
 */

export type Operation = (input: IAutoMovieRecoveryChartFitSolve.Input,
prepared: ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation>,
system: ReturnType<IAutoMovieRecoveryChartFitSystem.Operation>) => {
 
 /** Lower componentwise control bound in the normalized solver chart. */
lo: [number, number, number];
 
 /** Upper componentwise control bound in the normalized solver chart. */
hi: [number, number, number];
 
 /** Numerical box-solver output retained with its actual termination and objective diagnostics. */
solved: ReturnType<IAutoMovieRecoveryChartBoxSolve.Operation>;
 
 /** Owned normalized solution storage ordered by independent-control slot and Cartesian coordinate. */
x: Float64Array;
 
 /** Actual numerical iterations attempted, including iterations without an accepted update. */
iterations: number;
 
 /** Infinity norm of the normalized projected-gradient mapping used for termination. */
projectedGradient: number;
 
 /** Shared coefficient registry or its declared population, addressed by patch control IDs. */
controls: Readonly<AutoMovieVector3Tuple>[];
 
 /** Largest excursion of an affine dependent control outside the original millimetre box; zero means none observed. */
dependentEnclosureViolationMm: number;
};


/**
 * Input observations and explicit numerical policy for RecoveryChartFitSolve. The supplying workflow owns admission before execution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Solve the normalized box problem and reconstruct the original coefficient registry.
 * @evidence contracts/development/design.md#principled-representation Solve the normalized box problem and reconstruct the original coefficient registry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryChartFit, RecoveryChartFitReport, RecoveryChartFitSolve share IAutoMovieRecoveryChartFitSolve's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */
export type Input = IAutoMovieRecoveryChartFit.Input;
}

