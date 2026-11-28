import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraSceneEstimate,
  IAutoMovieRecoveryCameraSceneInput,
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryFeasibleJointOptions,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
} from "..";

/**
 * Callable contract for building one bounded sparse component from observed
 * calibrated camera features.
 */

export namespace IAutoMovieRecoveryCameraSceneCreationOperation {
  /**
   * Fit the ordered seed after global linkage, then attempt pending cameras
   * using support from the accepted points. Publish a new checkpoint only after
   * detached growth, joint fitting, and point qualification. An explicit
   * feasible method is copied and used for eligible fits. Progress callbacks
   * can terminate the operation by throwing.
   */

  export type Operation = (
    input: IAutoMovieRecoveryCameraSceneInput,
    features: readonly ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[],
    charts: readonly ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[],
    pairs: Parameters<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>[1],
    descriptorComparisons: number,
    checkpoint: (phase: string, completed: number, total: number) => void,
    feasible?: IAutoMovieRecoveryFeasibleJointOptions,
  ) => IAutoMovieRecoveryCameraSceneEstimate;
}
