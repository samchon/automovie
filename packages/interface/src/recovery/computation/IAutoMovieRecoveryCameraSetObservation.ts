import type {
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
} from "../../index";

/** Once-observed bounded image-set features and both directed pair populations. */
export interface IAutoMovieRecoveryCameraSetObservation {
  /** Source-order features, including transient numerical descriptors. */
  features: ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[];

  /** One forward/reverse record for each unordered image pair. */
  pairs: Parameters<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>[1][number][];

  /** Actual total oriented descriptor pairs compared. */
  descriptorComparisons: number;
}
