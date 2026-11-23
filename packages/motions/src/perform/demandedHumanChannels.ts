import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
} from "@automovie/interface";

import { AutoMovieMotionHumanChannel as HumanChannels } from "../compose/AutoMovieMotionHumanChannel";

/**
 * The posture channels the frames of some bones depend on: the root and the
 * trunk every bone hangs from, each bone's own channel, and a digit's arm,
 * which carries its hand. A bone's world frame is the forward kinematics of
 * its ancestors' joints (`AutoMovieMotionHumanChannel`'s partition by the
 * kinematic tree), so a posture read on these channels alone gives those
 * bones exactly as the whole posture does: the demand-driven evaluation of
 * an animation graph's required bones (Unreal Engine `FBoneContainer`).
 *
 * @param bones The bones demanded.
 * @returns The channels, in writing order (`AutoMovieMotionHumanChannel.ORDER`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which channels a bone set needs and why the read is exact for them.
 * @evidence contracts/development/implementation.md#principled-implementation A bone's frame depends only on its ancestors' joints; the channel partition follows the kinematic tree, so the root, the trunk, the bone's own channel and a digit's arm cover every ancestor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the bones and one ordered filter.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bone is assumed independent of an ancestor; the root and the trunk are always demanded.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the demanded bones, over nine channels.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing and returns a fresh array.
 */
export function demandedHumanChannels(
  bones: ReadonlySet<AutoMovieHumanoidBone>,
): AutoMovieMotionHumanChannel[] {
  const needed: Set<AutoMovieMotionHumanChannel> = new Set<AutoMovieMotionHumanChannel>([
    "root",
    "trunk",
  ]);
  for (const bone of bones) {
    const channel: AutoMovieMotionHumanChannel = HumanChannels.of(bone);
    needed.add(channel);
    if (channel === "leftHand") needed.add("leftArm");
    else if (channel === "rightHand") needed.add("rightArm");
  }
  return HumanChannels.ORDER.filter(
    (channel: AutoMovieMotionHumanChannel): boolean => needed.has(channel),
  );
}
