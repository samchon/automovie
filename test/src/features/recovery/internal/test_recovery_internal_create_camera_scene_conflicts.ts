import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoveryConflictingSceneFixture } from "../../internal/createRecoveryConflictingSceneFixture";

/**
 * A late image's transitive conflict is withheld before initial seed
 * estimation.
 *
 * Scenarios:
 *
 * 1. With one reciprocal index link joining the seam tracks of identities 0 and
 *    48, the whole conflicting component is excluded from the seed's matches
 *    and from the final points, which keep the other 70 tracks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the late transitive identity conflict and the resulting seed and landmark exclusions.
 * @evidence contracts/development/testing.md#behavioral-verification Adds one reciprocal seam link, runs scene construction and checks support before and after registration.
 * @evidence contracts/development/testing.md#independent-expectations A link combining the independently authored tracks with IDs 0 and 48 removes two from the original population of 72.
 */
export function test_recovery_internal_create_camera_scene_conflicts(): void {
  const fixture: ReturnType<typeof createRecoveryConflictingSceneFixture> =
    createRecoveryConflictingSceneFixture();
  const result: ReturnType<typeof AutoMovieRecoveryCameraMap.createCameraScene> =
    AutoMovieRecoveryCameraMap.createCameraScene(
      fixture.input,
      fixture.features,
      AutoMovieRecoveryCameraMap.admitCameraScene(fixture.input),
      fixture.pairs,
      fixture.comparisons,
      (): void => {},
    );
  TestValidator.predicate(
    "global identity policy precedes seed geometry",
    result.seed.matches.length === 23 &&
      result.conflictingTracks === 1 &&
      result.status === "accepted-sparse-component" &&
      result.stopReason === "all-registered" &&
      result.landmarks.length === 70,
  );
  TestValidator.predicate(
    "neither merged identity leaks into accepted points",
    result.landmarks.every(
      (landmark: (typeof result.landmarks)[number]): boolean =>
        landmark.observations.every(
          (observation: (typeof landmark.observations)[number]): boolean => {
            const identity: number =
              fixture.identities[observation.viewIndex]![
                observation.featureIndex
              ]!;
            return identity !== 0 && identity !== 48;
          },
        ),
    ),
  );
}
