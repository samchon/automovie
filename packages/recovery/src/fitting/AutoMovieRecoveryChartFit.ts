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
   * Solve one constrained chart with assembled shared-control normal equations.
   * A positive diagonal congruence scales the original symmetric Gram problem
   * and its feasible box. The original projected-gradient mapping, not a
   * transformed residual, determines numerical termination. Each accelerated
   * step projects unknown coefficients onto the declared box; objective
   * increase restarts momentum. No geometry is sampled or tessellated here.
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
