import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraSceneEstimate,
  IAutoMovieRecoveryCameraSceneInput,
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryFeasibleJointOptions,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
} from "../../index";

/**
 * Register a bounded calibrated image set into one qualified sparse component. Global conflicting tracks are withheld before even seed geometry. Each new camera uses only existing points, then proposes registered-view point growth and common-gauge joint refinement. Only a complete transaction is committed. Explicit internal feasible options are copied before callbacks and reach both seed and candidate closure fits; public callers continue omitting them. A refused seed retains its last completed fit report separately from the accepted-only joint report, without retaining failed geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Register a bounded calibrated image set into one qualified sparse component. Global conflicting tracks are withheld before even seed geometry. Each new
 * @evidence contracts/development/design.md#principled-representation Register a bounded calibrated image set into one qualified sparse component. Global conflicting tracks are withheld before even seed geometry. Each new
 * @evidence contracts/development/design.md#minimal-and-owned-surface createRecoveryCameraScene share IAutoMovieRecoveryCameraSceneCreationOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryCameraSceneCreationOperation {
  /**
   * Register a bounded calibrated image set into one qualified sparse component. Global conflicting tracks are withheld before even seed geometry. Each new camera uses only existing points, then proposes registered-view point growth and common-gauge joint refinement. Only a complete transaction is committed. Explicit internal feasible options are copied before callbacks and reach both seed and candidate closure fits; public callers continue omitting them. A refused seed retains its last completed fit report separately from the accepted-only joint report, without retaining failed geometry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Register a bounded calibrated image set into one qualified sparse component. Global conflicting tracks are withheld before even seed geometry. Each new
   * @evidence contracts/development/design.md#principled-representation Register a bounded calibrated image set into one qualified sparse component. Global conflicting tracks are withheld before even seed geometry. Each new
   * @evidence contracts/development/design.md#minimal-and-owned-surface createRecoveryCameraScene share IAutoMovieRecoveryCameraSceneCreationOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
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
