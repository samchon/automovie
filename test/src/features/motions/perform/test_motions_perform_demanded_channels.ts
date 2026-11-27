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
