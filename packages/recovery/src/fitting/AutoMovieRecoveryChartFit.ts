import type {
  IAutoMovieRecoveryChartFit,
  IAutoMovieRecoveryChartFitPrepare,
  IAutoMovieRecoveryChartFitSolve,
  IAutoMovieRecoveryChartFitSystem,
} from "@automovie/interface";

import { RecoveryChartFitPrepare } from "../observation/internal/RecoveryChartFitPrepare";
import { RecoveryChartFitReport } from "../observation/internal/RecoveryChartFitReport";
import { RecoveryChartFitSolve } from "../observation/internal/RecoveryChartFitSolve";
import { RecoveryChartFitSystem } from "../observation/internal/RecoveryChartFitSystem";

/**
 * Joint Bernstein fitting with fixed shared coefficients and explicit box
 * constraints.
 */
export namespace AutoMovieRecoveryChartFit {
  /**
   * Fit a prepared registered bicubic chart to weighted observed positions and
   * optional physical-gradient rows. Input and returned controls use
   * millimetres. Supply a finite ordered enclosure, finite fitting and
   * validation points, valid local UV and patch addresses, and finite positive
   * fit tolerances with a safe iteration cap. Invalid input throws. Valid
   * outputs retain residual, rank and projected-gradient diagnostics even when
   * the chart remains unqualified.
   */
  export function fit(
    input: IAutoMovieRecoveryChartFit.Input,
  ): IAutoMovieRecoveryChartFit.Result {
    const prepared: ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation> =
      RecoveryChartFitPrepare(input);
    const system: ReturnType<IAutoMovieRecoveryChartFitSystem.Operation> =
      RecoveryChartFitSystem(input, prepared);
    const solution: ReturnType<IAutoMovieRecoveryChartFitSolve.Operation> =
      RecoveryChartFitSolve(input, prepared, system);
    return RecoveryChartFitReport(input, prepared, system, solution);
  }
}
