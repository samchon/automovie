import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionMeeting,
  IAutoMovieMotionMeetingTiming,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionMeeting } from "../../compose/internal/AutoMovieMotionMeeting";

/*
 * A phrase with the kiss's two contact events: `contact` at its `ready` and
 * `part` at its `relax`.
 * Parameter timed: The phrase.
 * Returns: The phrase with both events.
 */
export function kissClock(timed: IAutoMovieMotionClock): IAutoMovieMotionClock {
  return AutoMovieMotionClock(timed.duration, [
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
    const local: IAutoMovieMotionMeetingTiming = AutoMovieMotionMeeting.local(
      meeting,
      start,
    );
    return kissClock(
      AutoMovieMotionClock.phrase({
        prepare: local.ready,
        attack: 0,
        hold: local.relax - local.ready,
        retract: local.ready,
      }),
    );
  }
}
