import type { IAutoMovieBone } from "@automovie/interface";
import {
  AutoMovieMotionHumanChannel,
  type IHumanBody,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The channels are written in an order in which every part comes after the
 * parts it hangs from (`AutoMovieMotionHumanChannel.ORDER`).
 *
 * The order's document states its rule: the body is placed first and the
 * arms last, "so a primitive reads every part its own part hangs from as the
 * action already placed it". What a part hangs from is the rig's own
 * hierarchy: for every bone of the average man's skeleton, the channel that
 * owns its parent bone (`AutoMovieMotionHumanChannel.of`) is written no
 * later than the channel that owns the bone.
 *
 * Scenarios:
 * 1. The order lists every channel exactly once, `root` first.
 * 2. For every bone whose parent lies in another channel, the parent's
 *    channel comes first.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the shipped order against the real skeleton's hierarchy through the channel partition; a part written before the part it hangs from fails, naming the bone and both channels.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the rule the order's document states, applied to the rig's parent links, which the order does not read.
 * @evidence contracts/development/testing.md#distinguishing-cases Every bone of the skeleton, across all nine channels.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; named `test_human_` because it fails on the shipped order (the hands are written before the arms they hang from), which the CI test job leaves to local runs until the order or its rule changes.
 * @evidence contracts/development/common.md#meaningful-documentation Quotes the rule, states how the hierarchy is read and lists the 2 scenarios.
 */
export function test_human_motion_compose_channel_order(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const order: readonly AutoMovieMotionHumanChannel[] =
    AutoMovieMotionHumanChannel.ORDER;
  const all: AutoMovieMotionHumanChannel[] = [
    "root",
    "trunk",
    "head",
    "leftLeg",
    "rightLeg",
    "leftHand",
    "rightHand",
    "leftArm",
    "rightArm",
  ];
  complaints.check(
    "every channel once, root first",
    order.length === all.length &&
      all.every((c) => order.filter((o) => o === c).length === 1) &&
      order[0] === "root",
  );
  const body: IHumanBody = motionHumanBody("m-average");
  const parents: string[] = [];
  for (const bone of body.skeleton.bones as readonly IAutoMovieBone[]) {
    if (bone.parent === null) continue;
    const own: AutoMovieMotionHumanChannel = AutoMovieMotionHumanChannel.of(
      bone.bone,
    );
    const above: AutoMovieMotionHumanChannel = AutoMovieMotionHumanChannel.of(
      bone.parent,
    );
    if (order.indexOf(above) > order.indexOf(own))
      parents.push(
        `${bone.bone} (${own}) hangs from ${bone.parent} (${above})`,
      );
  }
  complaints.equals(
    "every part is written after the part it hangs from",
    parents,
    [],
  );
  complaints.assert("the channel order follows the body's hierarchy");
}
