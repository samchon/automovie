import { linkRecoveryCameraTracks } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { createRecoveryConflictingSceneFixture } from "../../../internal/createRecoveryConflictingSceneFixture";

/**
 * `linkRecoveryCameraTracks` merges a late image's reciprocal link transitively
 * and reports the conflict it makes.
 *
 * Scenarios:
 *
 * 1. Of the fixture's 72 seam tracks, one link between the seed and the last image
 *    joins the tracks of identities 0 and 48 into one conflicting global
 *    component, leaving 72 - 2 = 70 tracks.
 */
export function test_unit_recovery_internal_link_camera_tracks_conflicts(): void {
  const fixture: ReturnType<typeof createRecoveryConflictingSceneFixture> =
    createRecoveryConflictingSceneFixture();
  const linked: ReturnType<typeof linkRecoveryCameraTracks> =
    linkRecoveryCameraTracks(
      fixture.features,
      fixture.pairs,
      fixture.input.budget,
    );
  TestValidator.equals(
    "one conflicting component of two merged tracks",
    [linked.conflictingComponents, linked.tracks.length],
    [1, 70],
  );
}
