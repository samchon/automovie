import type {
  IAutoMovieRecoveryCameraTracksLinkageOperation,
  IAutoMovieRecoverySceneCandidate,
  IAutoMovieRecoverySceneSupportCollectionOperation,
} from "@automovie/interface";

/**
 * Collect each target's distinct existing-map support once per accepted
 * revision.
 */
export function collectRecoverySceneSupport(
  landmarks: Parameters<IAutoMovieRecoverySceneSupportCollectionOperation.Operation>[0],
  tracks: Parameters<IAutoMovieRecoverySceneSupportCollectionOperation.Operation>[1],
  viewCount: Parameters<IAutoMovieRecoverySceneSupportCollectionOperation.Operation>[2],
): ReturnType<IAutoMovieRecoverySceneSupportCollectionOperation.Operation> {
  const support: IAutoMovieRecoverySceneCandidate[][] = Array.from(
    { length: viewCount },
    (): IAutoMovieRecoverySceneCandidate[] => [],
  );
  for (let at: number = 0; at < landmarks.length; at++) {
    const track:
      | ReturnType<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation>["tracks"][number]
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
