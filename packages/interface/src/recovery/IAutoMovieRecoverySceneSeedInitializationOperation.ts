import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraPairEstimate,
  IAutoMovieRecoveryCameraSceneInput,
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
} from "..";

/**
 * Callable estimation of the source-zero and source-one seed from globally
 * admitted reciprocal links.
 */

export namespace IAutoMovieRecoverySceneSeedInitializationOperation {
  /**
   * Use views zero and one, their admitted charts and observed features. Pass
   * only directly reciprocal seed matches whose feature pair belongs to a
   * nonconflicting global track into pair qualification. A missing seed match
   * pair raises an error. A completed pair keeps its own qualification and
   * diagnostic status.
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
