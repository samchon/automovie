import {
  unfollowedHumanChannels
} from "../../../../../packages/motions/src/perform/internal/unfollowedHumanChannels";
import { TestValidator } from "@nestia/e2e";

/**
 * `unfollowedHumanChannels` gives the channels a plan's own reading asks for at
 * a second: every channel in writing order but those following a partner over
 * a window holding the second, ends included within a nanosecond, or the whole
 * posture where nothing follows.
 *
 * Scenarios, for the left arm following from 1 to 2 s and the head from 1.5 to
 * 3 s:
 *
 * 1. At 0.5 s and 3.5 s nothing follows: the whole posture.
 * 2. At 1.2 s every channel but the left arm, in writing order.
 * 3. At 1.75 s neither the left arm nor the head.
 * 4. A nanosecond's rounding outside either end of a window still holds it.
 * 5. A plan without follows reads the whole posture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names inactive, single and overlapping follow windows, an absent plan and the tested timing margin outside both ends.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `unfollowedHumanChannels` with typed left-arm and head windows. It checks exact ordered retained channels during active intervals and undefined when a full-posture read applies.
 * @evidence contracts/development/testing.md#independent-expectations At 1.2 s only leftArm is active, and at 1.75 s leftArm and head are active. An offset of 0.5 ns outside each outer boundary stays inside the tested tolerance, while 2 ns outside returns undefined.
 */
export function test_motions_perform_unfollowed_channels(): void {
  const plan: Parameters<typeof unfollowedHumanChannels>[0] = {
    follows: [
      { channel: "leftArm", from: 1, to: 2 },
      { channel: "head", from: 1.5, to: 3 },
    ],
  };
  TestValidator.predicate(
    "nothing follows",
    unfollowedHumanChannels(plan, 0.5) === undefined &&
      unfollowedHumanChannels(plan, 3.5) === undefined &&
      unfollowedHumanChannels({}, 1.2) === undefined,
  );
  TestValidator.equals("the left arm follows", unfollowedHumanChannels(plan, 1.2), [
    "root",
    "trunk",
    "head",
    "leftLeg",
    "rightLeg",
    "leftHand",
    "rightHand",
    "rightArm",
  ]);
  TestValidator.equals(
    "the left arm and the head follow",
    unfollowedHumanChannels(plan, 1.75),
    ["root", "trunk", "leftLeg", "rightLeg", "leftHand", "rightHand", "rightArm"],
  );
  TestValidator.predicate(
    "the ends hold within a nanosecond's rounding",
    unfollowedHumanChannels(plan, 1 - 5e-10)?.includes("leftArm") === false &&
      unfollowedHumanChannels(plan, 3 + 5e-10)?.includes("head") === false &&
      unfollowedHumanChannels(plan, 3 + 2e-9) === undefined &&
      unfollowedHumanChannels(plan, 1 - 2e-9) === undefined,
  );
}
