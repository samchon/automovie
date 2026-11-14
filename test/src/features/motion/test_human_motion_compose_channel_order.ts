import {
  AutoMovieMotionHumanChannel,
  type IHumanBody,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The channels are written in the order their document gives
 * (`AutoMovieMotionHumanChannel.ORDER`): the body first, the hands before
 * the arms, the arms last.
 *
 * The body (the root, the trunk, the head and the legs) is placed before
 * anything that hangs from it, so a part reads the trunk it hangs from as
 * the action already placed it. The fingers are written before the arms
 * because an arm's goal lays a hand surface whose place depends on the
 * fingers' shape, while the finger angles read nothing of the arm. Which
 * part a bone belongs to is the partition `AutoMovieMotionHumanChannel.of`
 * gives on the average man's skeleton.
 *
 * Scenarios:
 * 1. The order lists every channel exactly once, `root` first.
 * 2. Every channel of the body (the root, the trunk, the head, the legs)
 *    comes before every hand and arm channel.
 * 3. Each hand comes before both arms, and the two arms are last.
 * 4. The partition puts every finger bone in its side's hand channel and
 *    the hand bone itself in its side's arm channel, so the rule is about
 *    the bones the skeleton has.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the shipped order and the partition on the real skeleton; a hand written after its arm, an arm before the trunk or a finger in another channel fails.
 * @evidence contracts/development/testing.md#independent-expectations The order is the rule the document states with its reason; the partition is read bone by bone.
 * @evidence contracts/development/testing.md#distinguishing-cases All nine channels, every finger bone and both hand bones.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; grouped with the other real-body composition tests; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule with its reason and the 4 scenarios.
 */
export function test_human_motion_compose_channel_order(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const order: readonly AutoMovieMotionHumanChannel[] =
    AutoMovieMotionHumanChannel.ORDER;
  const at = (channel: AutoMovieMotionHumanChannel): number =>
    order.indexOf(channel);
  const body: AutoMovieMotionHumanChannel[] = [
    "root",
    "trunk",
    "head",
    "leftLeg",
    "rightLeg",
  ];
  const hands: AutoMovieMotionHumanChannel[] = ["leftHand", "rightHand"];
  const arms: AutoMovieMotionHumanChannel[] = ["leftArm", "rightArm"];
  const all: AutoMovieMotionHumanChannel[] = [...body, ...hands, ...arms];
  complaints.check(
    "every channel once, root first",
    order.length === all.length &&
      all.every((c) => order.filter((o) => o === c).length === 1) &&
      order[0] === "root",
  );
  complaints.check(
    "the body comes before the hands and the arms",
    body.every((b) => [...hands, ...arms].every((h) => at(b) < at(h))),
  );
  complaints.check(
    "the hands come before the arms, and the arms are last",
    hands.every((h) => arms.every((a) => at(h) < at(a))) &&
      arms.every((a) => at(a) >= order.length - arms.length),
  );
  const person: IHumanBody = motionHumanBody("m-average");
  const misplaced: string[] = [];
  for (const { bone } of person.skeleton.bones) {
    const side: "left" | "right" | undefined = bone.startsWith("left")
      ? "left"
      : bone.startsWith("right")
        ? "right"
        : undefined;
    if (side === undefined) continue;
    const finger: boolean = /(Thumb|Index|Middle|Ring|Little)/.test(bone);
    const expected: AutoMovieMotionHumanChannel | undefined = finger
      ? `${side}Hand`
      : bone === `${side}Hand`
        ? `${side}Arm`
        : undefined;
    if (
      expected !== undefined &&
      AutoMovieMotionHumanChannel.of(bone) !== expected
    )
      misplaced.push(
        `${bone} is in ${AutoMovieMotionHumanChannel.of(bone)}, not ${expected}`,
      );
  }
  complaints.equals(
    "fingers in the hands, hand bones in the arms",
    misplaced,
    [],
  );
  complaints.assert("the channel order follows its documented rule");
}
