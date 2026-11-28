import { AutoMovieRecoveryObservation } from "@automovie/recovery";
import type { IAutoMovieRecoveryCameraTracksLinkageOperation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createRecoveryConflictingSceneFixture } from "../../internal/createRecoveryConflictingSceneFixture";

/**
 * `linkRecoveryCameraTracks` merges a late image's reciprocal link transitively
 * and reports the conflict it makes.
 *
 * Scenarios:
 *
 * 1. Of the fixture's 72 seam tracks, one link between the seed and the last image
 *    joins the tracks of identities 0 and 48 into one conflicting global
 *    component, leaving 72 - 2 = 70 tracks.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States transitive reciprocal linkage and conflict population accounting.
 * @evidence contracts/development/testing.md#behavioral-verification Adds the late reciprocal link to the authored scene fixture and checks reported conflicts and retained tracks.
 * @evidence contracts/development/testing.md#independent-expectations Joining seam identities 0 and 48 means that two of 72 independent identities can no longer be retained.
 */
export function test_recovery_internal_link_camera_tracks_conflicts(): void {
  const fixture: ReturnType<typeof createRecoveryConflictingSceneFixture> =
    createRecoveryConflictingSceneFixture();
  const linked: ReturnType<IAutoMovieRecoveryCameraTracksLinkageOperation.Operation> =
    AutoMovieRecoveryObservation.linkCameraTracks(
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
