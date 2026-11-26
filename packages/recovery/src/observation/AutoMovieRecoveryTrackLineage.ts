import { type IAutoMovieRecoverySceneTrackTriangulationOperation, type IAutoMovieRecoveryImageFeaturesMatchingOperation, type IAutoMovieRecoverySceneSeedInitializationOperation } from "@automovie/interface";
import { triangulateRecoverySceneTrack as triangulateRecoverySceneTrackImplementation } from "./internal/triangulateRecoverySceneTrack";
import { matchRecoveryImageFeatures as matchRecoveryImageFeaturesImplementation } from "./internal/matchRecoveryImageFeatures";
import { initializeRecoverySceneSeed as initializeRecoverySceneSeedImplementation } from "./internal/initializeRecoverySceneSeed";

/** Public operations for Auto Movie Recovery Track Lineage. */
export namespace AutoMovieRecoveryTrackLineage {
  /**
   * Triangulate one new track using only already registered camera observations.
   * The original 2k-by-4 homogeneous design uses calibrated world-to-camera rows;
   * its finite point remains in the common seed gauge, not a new pair unit
   * gauge.
   */
  export function triangulateSceneTrack(observations: Parameters<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation>[0], poses: Parameters<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation>[1], charts: Parameters<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation>[2], policy: Parameters<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation>[3], budget: Parameters<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation>[4]): ReturnType<IAutoMovieRecoverySceneTrackTriangulationOperation.Operation> {
    return triangulateRecoverySceneTrackImplementation(observations, poses, charts, policy, budget);
  }

  /**
   * Compare every admitted descriptor pair once and retain unique mutual matches.
   * The strict Euclidean ratio requires a distinct second feature in the other
   * image. Reverse exact ties refuse rather than choosing a material identity by
   * array order. This appearance test proposes correspondences, not their truth.
   */
  export function matchImageFeatures(first: Parameters<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>[0], second: Parameters<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>[1], ratio: Parameters<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>[2], maxPairs: Parameters<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation>[3]): ReturnType<IAutoMovieRecoveryImageFeaturesMatchingOperation.Operation> {
    return matchRecoveryImageFeaturesImplementation(first, second, ratio, maxPairs);
  }

  /**
   * Estimate the explicit seed using only globally admitted direct reciprocal
   * links. This reconstructs pose support under the complete identity policy
   * instead of deleting landmarks after a prior local-map fit has influenced its
   * cameras.
   */
  export function initializeSceneSeed(input: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[0], features: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[1], charts: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[2], pairs: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[3], tracks: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[4], checkpoint: Parameters<IAutoMovieRecoverySceneSeedInitializationOperation.Operation>[5]): ReturnType<IAutoMovieRecoverySceneSeedInitializationOperation.Operation> {
    return initializeRecoverySceneSeedImplementation(input, features, charts, pairs, tracks, checkpoint);
  }
}
