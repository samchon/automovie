import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
  IAutoMovieRecoveryTrackLinkage,
  IAutoMovieRecoveryTrackPair,
} from "..";

/**
 * Callable linkage of calibrated image feature identities through reciprocal
 * appearance matches.
 */

export namespace IAutoMovieRecoveryCameraTracksLinkageOperation {
  /**
   * Intersect matched index pairs in both directions, join the surviving
   * feature nodes, and withhold any component containing multiple features from
   * the same source. Enforce the linked observation and component caps as the
   * populations grow. Returned components remain tentative appearance
   * evidence.
   */

  export type Operation = (
    features: readonly ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[],
    pairs: readonly IAutoMovieRecoveryTrackPair[],
    budget: IAutoMovieRecoveryCameraMapBudget,
  ) => IAutoMovieRecoveryTrackLinkage;
}
