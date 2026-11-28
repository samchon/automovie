import type {
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
} from "..";

/**
 * Completed feature extraction and pairwise matching for an admitted camera
 * set. The result keeps source order and counts the descriptor comparisons
 * actually performed.
 */
export interface IAutoMovieRecoveryCameraSetObservation {
  /** One retained feature population per admitted view, in source order. */
  features: ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[];

  /** One record per unordered view pair, with both authored search directions. */
  pairs: Parameters<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>[1][number][];

  /**
   * Total actual descriptor comparisons in eligible directed searches across
   * the set.
   */
  descriptorComparisons: number;
}
