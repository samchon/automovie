import type {
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryMapLandmark,
  IAutoMovieRecoverySceneCandidate,
} from "..";

/**
 * Collect each target's distinct existing-map support once per accepted
 * revision.
 */

export namespace IAutoMovieRecoverySceneSupportCollectionOperation {
  /**
   * Collect each target's distinct existing-map support once per accepted
   * revision.
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
