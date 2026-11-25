import type {
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanFollow,
} from "@automovie/interface";

import { AutoMovieMotionHumanChannel as HumanChannels } from "../compose/AutoMovieMotionHumanChannel";

/**
 * The channels of a plan a reading of its own limb goals asks for at a second:
 * every channel but those whose writer follows a partner live over a window
 * holding the second (`IAutoMovieMotionHumanActionPlan.follows`), whose
 * follower plans them there and whose reading would read that partner; the
 * whole posture wherever nothing follows anyone.
 *
 * @param plan The plan.
 * @param seconds Seconds since the plan's start.
 * @returns The channels, in writing order, or undefined for the whole posture.
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
