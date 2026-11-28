import type {
  IAutoMovieRecoveryChartFitPrepare,
  IAutoMovieRecoveryChartFitSolve,
  IAutoMovieRecoveryChartFitSystem,
} from "..";
import type { IAutoMovieRecoveryChartFit as IAutoMovieRecoveryChartFit_2 } from "./IAutoMovieRecoveryChartFit";

/**
 * Callable measurement and qualification of a completed constrained chart
 * solve.
 */

export namespace IAutoMovieRecoveryChartFitReport {
  /**
   * Evaluate weighted fitting rows and supplied validation correspondences on
   * the reconstructed control registry. Report the first strictly larger
   * maximum witness, separate rank and gradient diagnostics, and enclosure and
   * residual qualifications.
   */

  export type Operation = (
    input: IAutoMovieRecoveryChartFit_2.Input,
    prepared: ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation>,
    system: ReturnType<IAutoMovieRecoveryChartFitSystem.Operation>,
    solution: ReturnType<IAutoMovieRecoveryChartFitSolve.Operation>,
  ) => IAutoMovieRecoveryChartFit_2.Result;
}
