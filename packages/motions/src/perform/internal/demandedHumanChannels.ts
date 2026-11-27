import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
} from "@automovie/interface";

import { AutoMovieMotionHumanChannel as HumanChannels } from "../../compose/AutoMovieMotionHumanChannel";

/**
 * The posture channels the frames of some bones depend on: the root and the
 * trunk every bone hangs from, each bone's own channel, and a digit's arm,
 * which carries its hand. A bone's world frame is the forward kinematics of its
 * ancestors' joints (`AutoMovieMotionHumanChannel`'s partition by the kinematic
 * tree), so a posture read on these channels alone gives those bones exactly as
 * the whole posture does: the demand-driven evaluation of an animation graph's
 * required bones.
 *
 * @param bones The bones demanded.
 * @returns The channels, in writing order
 *   (`AutoMovieMotionHumanChannel.ORDER`).
 */
export function demandedHumanChannels(
  bones: ReadonlySet<AutoMovieHumanoidBone>,
): AutoMovieMotionHumanChannel[] {
  const needed: Set<AutoMovieMotionHumanChannel> =
    new Set<AutoMovieMotionHumanChannel>(["root", "trunk"]);
  for (const bone of bones) {
    const channel: AutoMovieMotionHumanChannel = HumanChannels(bone);
    needed.add(channel);
    if (channel === "leftHand") needed.add("leftArm");
    else if (channel === "rightHand") needed.add("rightArm");
  }
  return HumanChannels.ORDER.filter(
    (channel: AutoMovieMotionHumanChannel): boolean => needed.has(channel),
  );
}
