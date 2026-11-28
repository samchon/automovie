import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryChartBoxSolve,
  IAutoMovieRecoveryChartFitPrepare,
  IAutoMovieRecoveryChartFitSystem,
} from "..";
import type { IAutoMovieRecoveryChartFit as IAutoMovieRecoveryChartFit_2 } from "./IAutoMovieRecoveryChartFit";

/** Callable solution and millimetre control reconstruction for a prepared fit. */

export namespace IAutoMovieRecoveryChartFitSolve {
  /**
   * Solve the assembled sparse box system in its normalized coordinates,
   * preserving any independently supplied feasible starting values. Reconstruct
   * fixed, free and dependent controls in the original registry, and measure
   * dependent enclosure violations.
   */

  export type Operation = (
    input: IAutoMovieRecoveryChartFit_2.Input,
    prepared: ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation>,
    system: ReturnType<IAutoMovieRecoveryChartFitSystem.Operation>,
  ) => {
    /** Lower componentwise bounds in normalized independent-control coordinates. */
    lo: [number, number, number];

    /** Upper componentwise bounds in normalized independent-control coordinates. */
    hi: [number, number, number];

    /**
     * Complete sparse box solve result before physical coefficient
     * reconstruction.
     */
    solved: ReturnType<IAutoMovieRecoveryChartBoxSolve.Operation>;

    /** Best feasible normalized three-axis values in independent-slot order. */
    x: Float64Array;

    /** Number of projected proposals reported by the box solver. */
    iterations: number;

    /**
     * Original normalized projected-gradient infinity norm at the returned
     * values.
     */
    projectedGradient: number;

    /** Reconstructed millimetre controls in original registry order. */
    controls: Readonly<AutoMovieVector3Tuple>[];

    /**
     * Largest dependent-control excursion outside the original physical
     * enclosure, in millimetres.
     */
    dependentEnclosureViolationMm: number;
  };
}
