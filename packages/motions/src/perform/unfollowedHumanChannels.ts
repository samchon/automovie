import type {
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanFollow,
} from "@automovie/interface";

import { AutoMovieMotionHumanChannel as HumanChannels } from "../compose/AutoMovieMotionHumanChannel";

/**
 * The channels of a plan a reading of its own limb goals asks for at a
 * second: every channel but those whose writer follows a partner live over
 * a window holding the second (`IAutoMovieMotionHumanActionPlan.follows`),
 * whose follower plans them there and whose reading would read that
 * partner; the whole posture wherever nothing follows anyone.
 *
 * @param plan The plan.
 * @param seconds Seconds since the plan's start.
 * @returns The channels, in writing order, or undefined for the whole posture.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which channels are asked for at a second and the whole-posture case.
 * @evidence contracts/development/implementation.md#principled-implementation A reading needs only the channels it uses (the demand-driven evaluation of required parts, Unreal Engine `FBoneContainer`); inside its window an arm a follower plans adds no goal to the plan's own course, only a dependency on the partner it tracks, and outside it the arm is the plan's own.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the windows and one ordered filter.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a channel whose window holds the second is left out, with the composer's own window allowance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the plan's follow windows, over nine channels.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function unfollowedHumanChannels(
  plan: Pick<IAutoMovieMotionHumanActionPlan, "follows">,
  seconds: number,
): AutoMovieMotionHumanChannel[] | undefined {
  const left: AutoMovieMotionHumanChannel[] = (plan.follows ?? [])
    .filter(
      (follow: IAutoMovieMotionHumanFollow): boolean =>
        seconds >= follow.from - 1e-9 && seconds <= follow.to + 1e-9,
    )
    .map(
      (follow: IAutoMovieMotionHumanFollow): AutoMovieMotionHumanChannel =>
        follow.channel,
    );
  if (left.length === 0) return undefined;
  return HumanChannels.ORDER.filter(
    (channel: AutoMovieMotionHumanChannel): boolean => !left.includes(channel),
  );
}
