import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
  IAutoMovieRecoveryTrackLinkage,
  IAutoMovieRecoveryTrackPair,
} from "../../index";

/**
 * Link bidirectionally ratio-qualified feature identities across fixed images.
 * A component containing two feature indices from one image is explicitly
 * conflicting and is withheld; even a conflict-free component is tentative
 * appearance linkage rather than material truth or a geometric landmark.
 */

export namespace IAutoMovieRecoveryCameraTracksLinkageOperation {
  /**
   * Link bidirectionally ratio-qualified feature identities across fixed
   * images. A component containing two feature indices from one image is
   * explicitly conflicting and is withheld; even a conflict-free component is
   * tentative appearance linkage rather than material truth or a geometric
   * landmark.
   */

  export type Operation = (
    features: readonly ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[],
    pairs: readonly IAutoMovieRecoveryTrackPair[],
    budget: IAutoMovieRecoveryCameraMapBudget,
  ) => IAutoMovieRecoveryTrackLinkage;
}
