import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraMapEstimate,
  IAutoMovieRecoveryCameraMapInput,
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
} from "../../index";

/**
 * Build one conditional three-camera map from automatic shared observations.
 * Only qualified seed pairs create 3D points. Third-image observations cannot
 * influence those points before resection, preventing circular registration.
 * Joint fitting subsequently uses only seed observations and resection
 * inliers.
 */

export namespace IAutoMovieRecoveryCameraMapCreationOperation {
  /**
   * Build one conditional three-camera map from automatic shared observations.
   * Only qualified seed pairs create 3D points. Third-image observations cannot
   * influence those points before resection, preventing circular registration.
   * Joint fitting subsequently uses only seed observations and resection
   * inliers.
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
