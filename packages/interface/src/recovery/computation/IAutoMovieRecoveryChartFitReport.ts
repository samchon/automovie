import type {
  IAutoMovieRecoveryChartFitPrepare,
  IAutoMovieRecoveryChartFitSolve,
  IAutoMovieRecoveryChartFitSystem,
} from "../../index";
import type { IAutoMovieRecoveryChartFit as IAutoMovieRecoveryChartFit_2 } from "./IAutoMovieRecoveryChartFit";

/**
 * Measure residuals, the first strict worst witness and optimality from the solved chart.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Measure residuals, the first strict worst witness and optimality from the solved chart.
 * @evidence contracts/development/design.md#principled-representation Measure residuals, the first strict worst witness and optimality from the solved chart.
 * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryChartFitReport share IAutoMovieRecoveryChartFitReport's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryChartFitReport {
  /**
   * Measure residuals, the first strict worst witness and optimality from the solved chart.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Measure residuals, the first strict worst witness and optimality from the solved chart.
   * @evidence contracts/development/design.md#principled-representation Measure residuals, the first strict worst witness and optimality from the solved chart.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryChartFitReport share IAutoMovieRecoveryChartFitReport's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    input: IAutoMovieRecoveryChartFit_2.Input,
    prepared: ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation>,
    system: ReturnType<IAutoMovieRecoveryChartFitSystem.Operation>,
    solution: ReturnType<IAutoMovieRecoveryChartFitSolve.Operation>,
  ) => IAutoMovieRecoveryChartFit_2.Result;
}
