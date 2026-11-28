import type { AutoMovieHumanoidBone } from "@automovie/interface";
import {
  demandedHumanChannels
} from "../../../../../packages/motions/src/perform/internal/demandedHumanChannels";
import { TestValidator } from "@nestia/e2e";

/**
 * `demandedHumanChannels` gives the posture channels some bones' frames hang
 * from: the root and the trunk always, each bone's own channel, and a hand's
 * arm, which carries it, in writing order (`motionHumanChannel.ORDER`:
 * root, trunk, head, the legs, the hands, the arms).
 *
 * Scenarios:
 *
 * 1. No bone: the root and the trunk.
 * 2. The head: its own channel added.
 * 3. A left finger: the left hand and the left arm it hangs from.
 * 4. A right shin: the right leg alone added.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Root and trunk are required for every observation. Separate fixtures add head, right leg, or left hand and its supporting arm in channel order.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `demandedHumanChannels` on an empty bone set and each of three literal bone requests, checking the exact ordered result.
 * @evidence contracts/development/testing.md#independent-expectations Head contributes its own channel, the right shin contributes rightLeg, and the left index finger depends on leftHand and leftArm. Root and trunk precede every added channel.
 */
export function test_motions_perform_demanded_channels(): void {
  const of = (
    bones: readonly AutoMovieHumanoidBone[],
  ): ReturnType<typeof demandedHumanChannels> =>
    demandedHumanChannels(new Set<AutoMovieHumanoidBone>(bones));
  TestValidator.equals("no bone", of([]), ["root", "trunk"]);
  TestValidator.equals("the head", of(["head"]), ["root", "trunk", "head"]);
  TestValidator.equals("a left finger", of(["leftIndexProximal"]), [
    "root",
    "trunk",
    "leftHand",
    "leftArm",
  ]);
  TestValidator.equals("a right shin", of(["rightLowerLeg"]), [
    "root",
    "trunk",
    "rightLeg",
  ]);
}
