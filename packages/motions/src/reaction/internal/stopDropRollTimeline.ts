import type { IAutoMovieMotionEvent } from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Stop, drop and roll's timetable: the body stands stopped `STOP`, drops over
 * the collapse's own length, then rolls onto a side and back `rolls` times
 * (four by default), `ROLL` each; cued `stop`, `drop`, `down` and `end`.
 * Parameter rolls: The rolls asked, rounded; four when absent.
 * Parameter down: The drop's seconds, the protective forward collapse's length.
 * Returns: The rolls, the seconds and the cues.
 * When the rolls round to no positive whole number.
 */
export function stopDropRollTimeline(
  rolls: number | undefined,
  down: number,
): stopDropRollTimeline.ITimeline {
  const count: number = Math.round(rolls ?? 4);
  if (!(count > 0))
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "rolls",
      value: count,
      reason: "the rolls are a positive whole number",
      fix: "give how many times the body rolls onto a side and back",
    });
  const stop: number = stopDropRollTimeline.STOP;
  const duration: number = stop + down + count * stopDropRollTimeline.ROLL;
  return {
    rolls: count,
    duration,
    events: [
      { name: "stop", share: 0 },
      { name: "drop", share: stop / duration },
      { name: "down", share: (stop + down) / duration },
      { name: "end", share: 1 },
    ],
  };
}

/*
 * Stop, drop and roll's timetable.
 */
export namespace stopDropRollTimeline {
  /*
   * How long the body stands stopped before it drops, seconds: authored.
   */
  export const STOP: number = 0.3;

  /*
   * How long one roll onto a side and back takes, seconds: authored.
   */
  export const ROLL: number = 0.9;

  /*
   * The rolls, the seconds and the cues.
   */
  export interface ITimeline {
    /*
     * The whole rolls.
     */
    rolls: number;

    /*
     * The action's seconds.
     */
    duration: number;

    /*
     * The action's cues.
     */
    events: IAutoMovieMotionEvent[];
  }
}
