import type {
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import { HumanSegmentSelection } from "./HumanSegmentSelection";

/** Read the raw active posture of an already resolved person, before layers. */
export function readPlacedHumanPosture(
  person: IAutoMovieMotionHumanSegment.IPerson,
  seconds: number,
  channels?: readonly AutoMovieMotionHumanChannel[],
): IAutoMovieMotionHumanPosture {
  const active: IAutoMovieMotionHumanSegment | undefined =
    HumanSegmentSelection.last(person.segments, seconds);
  return active === undefined
    ? person.initial
    : active.plan.posture(
        Math.min(active.plan.duration, Math.max(0, seconds - active.start)),
        channels,
      );
}
