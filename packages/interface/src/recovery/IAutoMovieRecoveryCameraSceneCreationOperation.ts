import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraSceneEstimate,
  IAutoMovieRecoveryCameraSceneInput,
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryFeasibleJointOptions,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
} from "..";

/**
 * Register a bounded calibrated image set into one qualified sparse component.
 * Global conflicting tracks are withheld before even seed geometry. Each new
 * camera uses only existing points, then proposes registered-view point growth
 * and common-gauge joint refinement. Only a complete transaction is committed.
 * Explicit internal feasible options are copied before callbacks and reach both
 * seed and candidate closure fits; public callers continue omitting them. A
 * refused seed retains its last completed fit report separately from the
 * accepted-only joint report, without retaining failed geometry.
 */

export namespace IAutoMovieRecoveryCameraSceneCreationOperation {
  /**
   * Register a bounded calibrated image set into one qualified sparse
   * component. Global conflicting tracks are withheld before even seed
   * geometry. Each new camera uses only existing points, then proposes
   * registered-view point growth and common-gauge joint refinement. Only a
   * complete transaction is committed. Explicit internal feasible options are
   * copied before callbacks and reach both seed and candidate closure fits;
   * public callers continue omitting them. A refused seed retains its last
   * completed fit report separately from the accepted-only joint report,
   * without retaining failed geometry.
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
