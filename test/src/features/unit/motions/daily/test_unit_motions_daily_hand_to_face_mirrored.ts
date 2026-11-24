import { handToFaceMirrored } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `handToFaceMirrored` gives the region a row names for a hand: the right
 * hand's own, mirrored for the left by swapping a trailing `Right` and `Left`.
 *
 * Scenarios:
 *
 * 1. The right hand keeps the row's region.
 * 2. The left hand mirrors a sided region both ways.
 * 3. A midline region is the same for either hand.
 */
export function test_unit_motions_daily_hand_to_face_mirrored(): void {
  TestValidator.equals(
    "the right hand",
    handToFaceMirrored("templeRight", "right"),
    "templeRight",
  );
  TestValidator.equals(
    "the left hand mirrored",
    [
      handToFaceMirrored("templeRight", "left"),
      handToFaceMirrored("templeLeft", "left"),
    ],
    ["templeLeft", "templeRight"],
  );
  TestValidator.equals(
    "a midline region",
    handToFaceMirrored("noseBridge", "left"),
    "noseBridge",
  );
}
