import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryImageFeaturesExtractionOperation,
  IAutoMovieRecoveryTrackLinkage,
  IAutoMovieRecoveryTrackPair,
} from "../../index";

/**
 * Link bidirectionally ratio-qualified feature identities across fixed images. A component containing two feature indices from one image is explicitly conflicting and is withheld; even a conflict-free component is tentative appearance linkage rather than material truth or a geometric landmark.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Link bidirectionally ratio-qualified feature identities across fixed images. A component containing two feature indices from one image is explicitly
 * @evidence contracts/development/design.md#principled-representation Link bidirectionally ratio-qualified feature identities across fixed images. A component containing two feature indices from one image is explicitly
 * @evidence contracts/development/design.md#minimal-and-owned-surface collectRecoverySceneSupport, createRecoveryCameraMap, createRecoveryCameraScene share IAutoMovieRecoveryCameraTracksLinkageOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoveryCameraTracksLinkageOperation {
  /**
   * Link bidirectionally ratio-qualified feature identities across fixed images. A component containing two feature indices from one image is explicitly conflicting and is withheld; even a conflict-free component is tentative appearance linkage rather than material truth or a geometric landmark.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Link bidirectionally ratio-qualified feature identities across fixed images. A component containing two feature indices from one image is explicitly
   * @evidence contracts/development/design.md#principled-representation Link bidirectionally ratio-qualified feature identities across fixed images. A component containing two feature indices from one image is explicitly
   * @evidence contracts/development/design.md#minimal-and-owned-surface collectRecoverySceneSupport, createRecoveryCameraMap, createRecoveryCameraScene share IAutoMovieRecoveryCameraTracksLinkageOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    features: readonly ReturnType<IAutoMovieRecoveryImageFeaturesExtractionOperation.Operation>[],
    pairs: readonly IAutoMovieRecoveryTrackPair[],
    budget: IAutoMovieRecoveryCameraMapBudget,
  ) => IAutoMovieRecoveryTrackLinkage;
}
