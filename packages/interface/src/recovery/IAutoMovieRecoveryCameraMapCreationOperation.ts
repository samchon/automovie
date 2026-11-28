import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraMapEstimate,
  IAutoMovieRecoveryCameraMapInput,
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
} from "..";

/**
 * Callable contract for fitting a conditional three-camera map from already
 * observed ordered features and admitted camera charts.
 */

export namespace IAutoMovieRecoveryCameraMapCreationOperation {
  /**
   * Build seed evidence from views zero and one using their direct matches,
   * link features across the observed pairs, and triangulate only
   * seed-supported landmarks. Resection uses those points and eligible
   * third-view matches. The candidate reports triad, seed-only, or refused
   * qualification after the bounded fitting stages.
   */

  export type Operation = (
    input: IAutoMovieRecoveryCameraMapInput,
    features: readonly ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[],
    charts: readonly ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>[],
    pairs: Parameters<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>[1],
    descriptorComparisons: number,
    checkpoint: (phase: string, completed: number, total: number) => void,
  ) => IAutoMovieRecoveryCameraMapEstimate;
}
