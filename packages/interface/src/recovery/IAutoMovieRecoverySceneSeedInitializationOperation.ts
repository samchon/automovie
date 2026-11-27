import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraPairEstimate,
  IAutoMovieRecoveryCameraSceneInput,
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
} from "..";

/**
 * Estimate the explicit seed using only globally admitted direct reciprocal
 * links. This reconstructs pose support under the complete identity policy
 * instead of deleting landmarks after a prior local-map fit has influenced its
 * cameras.
 */

export namespace IAutoMovieRecoverySceneSeedInitializationOperation {
  /**
   * Estimate the explicit seed using only globally admitted direct reciprocal
   * links. This reconstructs pose support under the complete identity policy
   * instead of deleting landmarks after a prior local-map fit has influenced
   * its cameras.
   */

  export type Operation = (
    input: IAutoMovieRecoveryCameraSceneInput,
    features: readonly ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[],
    charts: readonly ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[],
    pairs: Parameters<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>[1],
    tracks: ReturnType<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>["tracks"],
    checkpoint: (phase: string, completed: number, total: number) => void,
  ) => IAutoMovieRecoveryCameraPairEstimate;
}
