import type {
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryMapLandmark,
  IAutoMovieRecoverySceneCandidate,
} from "../../index";

/**
 * Collect each target's distinct existing-map support once per accepted revision.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Collect each target's distinct existing-map support once per accepted revision.
 * @evidence contracts/development/design.md#principled-representation Collect each target's distinct existing-map support once per accepted revision.
 * @evidence contracts/development/design.md#minimal-and-owned-surface collectRecoverySceneSupport share IAutoMovieRecoverySceneSupportCollectionOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMovieRecoverySceneSupportCollectionOperation {
  /**
   * Collect each target's distinct existing-map support once per accepted revision.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Collect each target's distinct existing-map support once per accepted revision.
   * @evidence contracts/development/design.md#principled-representation Collect each target's distinct existing-map support once per accepted revision.
   * @evidence contracts/development/design.md#minimal-and-owned-surface collectRecoverySceneSupport share IAutoMovieRecoverySceneSupportCollectionOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    landmarks: readonly IAutoMovieRecoveryMapLandmark[],
    tracks: ReadonlyMap<
      number,
      ReturnType<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>["tracks"][number]
    >,
    viewCount: number,
  ) => IAutoMovieRecoverySceneCandidate[][];
}
