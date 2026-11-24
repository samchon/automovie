import {
  admitRecoveryCameraScene,
  createRecoveryCameraScene,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoveryConflictingSceneFixture } from "../../../internal/createRecoveryConflictingSceneFixture";

/**
 * A late image's transitive conflict is withheld before initial seed
 * estimation.
 *
 * Scenarios:
 *
 * 1. With one reciprocal index link joining the seam tracks of identities 0 and
 *    48, the whole conflicting component is excluded from the seed's matches
 *    and from the final points, which keep the other 70 tracks.
 */
export function test_unit_recovery_internal_create_camera_scene_conflicts(): void {
  const fixture: ReturnType<typeof createRecoveryConflictingSceneFixture> =
    createRecoveryConflictingSceneFixture();
  const result: ReturnType<typeof createRecoveryCameraScene> =
    createRecoveryCameraScene(
      fixture.input,
      fixture.features,
      admitRecoveryCameraScene(fixture.input),
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
