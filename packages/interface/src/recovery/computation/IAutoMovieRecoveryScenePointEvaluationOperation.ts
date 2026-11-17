import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryMapObservation,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoveryScenePointEvaluation,
} from "../../index";

/**
 * Qualify one point against its actual retained registered measurements. At least one observed camera pair must supply an acute ray angle above the point threshold. A point need not be visible in either original seed image.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Qualify one point against its actual retained registered measurements. At least one observed camera pair must supply an acute ray angle above the
 * @evidence contracts/development/design.md#principled-representation Qualify one point against its actual retained registered measurements. At least one observed camera pair must supply an acute ray angle above the
 * @evidence contracts/development/design.md#minimal-and-owned-surface completeRecoverySceneCheckpoint, evaluateRecoveryScenePoint, refineRecoveryCameraMapFeasible share IAutoMovieRecoveryScenePointEvaluationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryScenePointEvaluationOperation {
  /**
   * Qualify one point against its actual retained registered measurements. At least one observed camera pair must supply an acute ray angle above the point threshold. A point need not be visible in either original seed image.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Qualify one point against its actual retained registered measurements. At least one observed camera pair must supply an acute ray angle above the
   * @evidence contracts/development/design.md#principled-representation Qualify one point against its actual retained registered measurements. At least one observed camera pair must supply an acute ray angle above the
   * @evidence contracts/development/design.md#minimal-and-owned-surface completeRecoverySceneCheckpoint, evaluateRecoveryScenePoint, refineRecoveryCameraMapFeasible share IAutoMovieRecoveryScenePointEvaluationOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    point: readonly [number, number, number],
    observations: readonly IAutoMovieRecoveryMapObservation[],
    poses: readonly (IAutoMovieRecoveryMapPose | null)[],
    charts: readonly Pick<
      ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
      "matrix"
    >[],
    policy: IAutoMovieRecoveryCameraMapPolicy,
    observe?: (norm: number) => void,
  ) => IAutoMovieRecoveryScenePointEvaluation;
}
