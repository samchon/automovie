import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryMapObservation,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoveryScenePointEvaluation,
} from "..";

/**
 * Callable qualification for one reconstructed point against its retained
 * registered observations.
 */

export namespace IAutoMovieRecoveryScenePointEvaluationOperation {
  /**
   * Project the common-gauge point through each retained camera's supplied
   * chart. Require distinct registered observations, positive depth, bounded
   * pixel residuals, and a sufficient strongest acute angle among their actual
   * viewing rays. The optional synchronous observer receives each computed
   * pixel residual and may interrupt by throwing.
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
