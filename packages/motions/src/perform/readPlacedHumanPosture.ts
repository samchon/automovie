import type {
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

import type { AutoMovieMotionHumanBendRepeat } from "../compose/AutoMovieMotionHumanBendRepeat";
import { HumanBendRead } from "../compose/HumanBendRead";
import { HumanSegmentSelection } from "./HumanSegmentSelection";

/**
 * Read the raw active posture of an already resolved person, before layers.
 */
export function readPlacedHumanPosture(
  person: IAutoMovieMotionHumanSegment.IPerson,
  seconds: number,
  channels?: readonly AutoMovieMotionHumanChannel[],
  trial?: readonly [
    IAutoMovieMotionHumanPerformanceState,
    AutoMovieMotionHumanBendRepeat,
  ],
): IAutoMovieMotionHumanPosture {
  const active: IAutoMovieMotionHumanSegment | undefined =
    HumanSegmentSelection.last(person.segments, seconds);
  if (trial !== undefined && active !== undefined) {
    const posture: IAutoMovieMotionHumanPosture | undefined =
      HumanBendRead.sample(trial[0], active, seconds, trial[1]);
    if (posture !== undefined) return posture;
  }
  return active === undefined
    ? person.initial
    : active.plan.posture(
        Math.min(active.plan.duration, Math.max(0, seconds - active.start)),
        channels,
      );
}
