import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraPairEstimate,
  IAutoMovieRecoveryCameraPairInput,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
  IAutoMovieRecoveryImageFeaturesMatchingOperation,
} from "..";

/**
 * Callable qualification of observed calibrated pair features and tentative
 * matches into pair evidence.
 */

export namespace IAutoMovieRecoveryCameraEstimateCreationOperation {
  /**
   * Use the admitted ordered charts, measured features and matches to build
   * pair evidence. Evaluate the available epipolar, pose and planar
   * qualification gates. The completed record retains a refused result's
   * diagnostics and carries a relative transform only after the pair
   * qualifies.
   */

  export type Operation = (
    input: IAutoMovieRecoveryCameraPairInput,
    features: readonly ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[],
    matches: ReturnType<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>,
    charts: [
      ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
      ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    ],
    checkpoint: (phase: string, completed: number, total: number) => void,
  ) => IAutoMovieRecoveryCameraPairEstimate;
}
