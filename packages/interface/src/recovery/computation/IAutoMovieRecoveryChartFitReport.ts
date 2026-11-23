import type {
  IAutoMovieRecoveryChartFitPrepare,
  IAutoMovieRecoveryChartFitSolve,
  IAutoMovieRecoveryChartFitSystem,
} from "../../index";
import type { IAutoMovieRecoveryChartFit as IAutoMovieRecoveryChartFit_2 } from "./IAutoMovieRecoveryChartFit";

/**
 * Measure residuals, the first strict worst witness and optimality from the
 * solved chart.
 */

export namespace IAutoMovieRecoveryChartFitReport {
  /**
   * Measure residuals, the first strict worst witness and optimality from the
   * solved chart.
   */

  export type Operation = (
    input: IAutoMovieRecoveryChartFit_2.Input,
    prepared: ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation>,
    system: ReturnType<IAutoMovieRecoveryChartFitSystem.Operation>,
    solution: ReturnType<IAutoMovieRecoveryChartFitSolve.Operation>,
  ) => IAutoMovieRecoveryChartFit_2.Result;
}
