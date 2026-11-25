import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraMapPolicy,
  IAutoMovieRecoveryMapObservation,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoveryScenePointEvaluation,
} from "../../index";

/**
 * Qualify one point against its actual retained registered measurements. At
 * least one observed camera pair must supply an acute ray angle above the point
 * threshold. A point need not be visible in either original seed image.
 */

export namespace IAutoMovieRecoveryScenePointEvaluationOperation {
  /**
   * Qualify one point against its actual retained registered measurements. At
   * least one observed camera pair must supply an acute ray angle above the
   * point threshold. A point need not be visible in either original seed
   * image.
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
