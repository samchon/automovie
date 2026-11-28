import { type IAutoMovieRecoverySceneTrackTriangulationOperation, type IAutoMovieRecoveryImageFeaturesMatchingOperation, type IAutoMovieRecoverySceneSeedInitializationOperation } from "@automovie/interface";
import { triangulateRecoverySceneTrack as triangulateRecoverySceneTrackImplementation } from "./internal/triangulateRecoverySceneTrack";
import { matchRecoveryImageFeatures as matchRecoveryImageFeaturesImplementation } from "./internal/matchRecoveryImageFeatures";
import { initializeRecoverySceneSeed as initializeRecoverySceneSeedImplementation } from "./internal/initializeRecoverySceneSeed";

/** Public operations for Auto Movie Recovery Track Lineage. */
export namespace AutoMovieRecoveryTrackLineage {
  /**
   * Triangulate a track from observations in already registered views. The
   * point and depths use the common map gauge, and its pixel errors and
   * parallax are measured against declared limits. Repeated views,
   * unregistered observations or insufficient support produce reasons without
   * a point.
   */
  export function triangulateSceneTrack(observations: Parameters<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation>[0], poses: Parameters<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation>[1], charts: Parameters<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation>[2], policy: Parameters<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation>[3], budget: Parameters<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation>[4]): ReturnType<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation> {
    return triangulateRecoverySceneTrackImplementation(observations, poses, charts, policy, budget);
  }

  /**
   * Match two admitted descriptor populations by unique reciprocal nearest
   * choices and a strict first-to-second distance ratio. Fewer than two
   * target descriptors yield no match or comparison work. A nonempty search
   * checks its comparison cap before traversal. Returned matches keep their
   * source feature indices and original pixel coordinates.
   */
  export function matchImageFeatures(first: Parameters<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>[0], second: Parameters<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>[1], ratio: Parameters<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>[2], maxPairs: Parameters<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>[3]): ReturnType<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation> {
    return matchRecoveryImageFeaturesImplementation(first, second, ratio, maxPairs);
  }

  /**
   * Qualify the explicit relative seed for registered views zero and one.
   * Supply their admitted charts and matches and the globally linked tracks.
   * Only direct reciprocal pairs that survive global identity lineage enter
   * the seed's conditional pose evidence.
   */
  export function initializeSceneSeed(input: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[0], features: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[1], charts: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[2], pairs: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[3], tracks: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[4], checkpoint: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[5]): ReturnType<IAutoMovieRecoverySceneSeedInitializationOperation.Operation> {
    return initializeRecoverySceneSeedImplementation(input, features, charts, pairs, tracks, checkpoint);
  }
}
