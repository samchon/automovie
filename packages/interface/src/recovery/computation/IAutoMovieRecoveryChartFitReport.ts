import type {
  IAutoMovieRecoveryChartFit,
  IAutoMovieRecoveryChartFitPrepare,
  IAutoMovieRecoveryChartFitSolve,
  IAutoMovieRecoveryChartFitSystem,
} from "../../index";

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
    input: IAutoMovieRecoveryChartFitReport.Input,
    prepared: ReturnType<IAutoMovieRecoveryChartFitPrepare.Operation>,
    system: ReturnType<IAutoMovieRecoveryChartFitSystem.Operation>,
    solution: ReturnType<IAutoMovieRecoveryChartFitSolve.Operation>,
  ) => IAutoMovieRecoveryChartFitReport.Result;

  /**
   * Input observations and explicit numerical policy for RecoveryChartFitReport. The supplying workflow owns admission before execution.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Measure residuals, the first strict worst witness and optimality from the solved chart.
   * @evidence contracts/development/design.md#principled-representation Measure residuals, the first strict worst witness and optimality from the solved chart.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryChartFitReport share IAutoMovieRecoveryChartFitReport's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */
  export type Input = IAutoMovieRecoveryChartFit.Input;

  /**
   * Returned coefficient or observation state from RecoveryChartFitReport. The caller owns the returned record after the synchronous operation ends.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Measure residuals, the first strict worst witness and optimality from the solved chart.
   * @evidence contracts/development/design.md#principled-representation Measure residuals, the first strict worst witness and optimality from the solved chart.
   * @evidence contracts/development/design.md#minimal-and-owned-surface RecoveryChartFitReport share IAutoMovieRecoveryChartFitReport's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */
  export type Result = IAutoMovieRecoveryChartFit.Result;
}
