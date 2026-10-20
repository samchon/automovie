import type { IAutoMovieRecoveryMapLandmark } from "../structures/image/IAutoMovieRecoveryMapLandmark";
import type { IAutoMovieRecoverySceneCandidate } from "../structures/internal/IAutoMovieRecoverySceneCandidate";
import type { linkRecoveryCameraTracks } from "./linkRecoveryCameraTracks";

/**
 * Collect each target's distinct existing-map support once per accepted revision.
 *
 * @evidence contracts/common.md#principled-implementation Each accepted landmark belongs to one fixed global nonconflicting track, whose unique target feature supplies at most one candidate per source. Candidate count is not geometric inlier support.
 * @evidence contracts/common.md#clear-and-simple-design One revision-local support table serves camera ordering, resection and final registration diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No re-detection, synthetic target measurement, independent point identity or expected pose supplies support.
 * @evidence contracts/common.md#meaningful-documentation States source-order output, accepted-landmark indices, global identity premise and invalid internal ownership failure.
 * @evidence contracts/performance.md#efficient-algorithms L accepted landmarks and E corresponding global observations require O(L+E+V) time/storage, avoiding a repeated V-by-L search for each consumer.
 * @evidence contracts/performance.md#reuse-equivalent-work One table is reused until accepted pose/point/measurement revision changes; fixed observations are not reacquired.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-owned candidate arrays borrow fixed observations only for the revision; no RGB, new descriptor or external resource is acquired.
 */
export function collectRecoverySceneSupport(
  landmarks: readonly IAutoMovieRecoveryMapLandmark[],
  tracks: ReadonlyMap<
    number,
    ReturnType<typeof linkRecoveryCameraTracks>["tracks"][number]
  >,
  viewCount: number,
): IAutoMovieRecoverySceneCandidate[][] {
  const support: IAutoMovieRecoverySceneCandidate[][] = Array.from(
    { length: viewCount },
    (): IAutoMovieRecoverySceneCandidate[] => [],
  );
  for (let at: number = 0; at < landmarks.length; at++) {
    const track:
      | ReturnType<typeof linkRecoveryCameraTracks>["tracks"][number]
      | undefined = tracks.get(landmarks[at]!.id);
    if (!track)
      throw new Error(
        "camera-scene: accepted point lacks global track identity",
      );
    for (const observation of track.observations)
      support[observation.viewIndex]!.push({ landmark: at, observation });
  }
  return support;
}
