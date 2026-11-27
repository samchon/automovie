import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryChartBoxSolve,
  IAutoMovieRecoveryChartFitPrepare,
  IAutoMovieRecoveryChartFitSystem,
} from "..";
import type { IAutoMovieRecoveryChartFit as IAutoMovieRecoveryChartFit_2 } from "./IAutoMovieRecoveryChartFit";

/**
 * Solve the normalized box problem and reconstruct the original coefficient
 * registry.
 */

export namespace IAutoMovieRecoveryChartFitSolve {
  /**
   * Solve the normalized box problem and reconstruct the original coefficient
   * registry.
   */

  export type Operation = (
    input: IAutoMovieRecoveryChartFit_2.Input,
    prepared: ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation>,
    system: ReturnType<IAutoMovieRecoveryChartFitSystem.Operation>,
  ) => {
    /** Lower componentwise control bound in the normalized solver chart. */
    lo: [number, number, number];

    /** Upper componentwise control bound in the normalized solver chart. */
    hi: [number, number, number];

    /**
     * Numerical box-solver output retained with its actual termination and
     * objective diagnostics.
     */
    solved: ReturnType<IAutoMovieRecoveryChartBoxSolve.Operation>;

    /**
     * Owned normalized solution storage ordered by independent-control slot and
     * Cartesian coordinate.
     */
    x: Float64Array;

    /**
     * Actual numerical iterations attempted, including iterations without an
     * accepted update.
     */
    iterations: number;

    /**
     * Infinity norm of the normalized projected-gradient mapping used for
     * termination.
     */
    projectedGradient: number;

    /**
     * Shared coefficient registry or its declared population, addressed by
     * patch control IDs.
     */
    controls: Readonly<AutoMovieVector3Tuple>[];

    /**
     * Largest excursion of an affine dependent control outside the original
     * millimetre box; zero means none observed.
     */
    dependentEnclosureViolationMm: number;
  };
}
