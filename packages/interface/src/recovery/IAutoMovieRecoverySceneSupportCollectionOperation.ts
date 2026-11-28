import type {
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoveryMapLandmark,
  IAutoMovieRecoverySceneCandidate,
} from "..";

/**
 * Callable collection of each source's current support from the accepted
 * landmark population.
 */

export namespace IAutoMovieRecoverySceneSupportCollectionOperation {
  /**
   * Join accepted landmarks to their global tracks and return one candidate
   * list per source index. Preserve the original feature and pixel observation
   * in each candidate. Raise an error when a landmark's track identity is
   * absent.
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
