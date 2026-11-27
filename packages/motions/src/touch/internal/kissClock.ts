import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionMeeting,
  IAutoMovieMotionMeetingTiming,
} from "@automovie/interface";

import { motionClock } from "../../compose/internal/motionClock";
import { motionMeeting } from "../../compose/internal/motionMeeting";

/*
 * A phrase with the kiss's two contact events: `contact` at its `ready` and
 * `part` at its `relax`.
 * Parameter timed: The phrase.
 * Returns: The phrase with both events.
 */
export function kissClock(timed: IAutoMovieMotionClock): IAutoMovieMotionClock {
  return motionClock(timed.duration, [
    ...timed.instants,
    { name: "contact", seconds: timed.at("ready") },
    { name: "part", seconds: timed.at("relax") },
  ]);
}

/*
 * The kiss's phrases built on kissClock.
 */
export namespace kissClock {
  /*
   * The phrase both roles of a hand kiss share: the same local contact and
   * departure instants, read from their meeting.
   * Parameter meeting: The meeting.
   * Parameter start: The action's film start, seconds.
   * Returns: The phrase with the kiss's contact events.
   */
  export function meeting(
    meeting: IAutoMovieMotionMeeting,
    start: number,
  ): IAutoMovieMotionClock {
    const local: IAutoMovieMotionMeetingTiming = motionMeeting.local(
      meeting,
      start,
    );
    return kissClock(
      motionClock.phrase({
        prepare: local.ready,
        attack: 0,
        hold: local.relax - local.ready,
        retract: local.ready,
      }),
    );
  }
}
