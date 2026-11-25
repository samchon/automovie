import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionManner,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";

/**
 * The sprint start's timetable: the crouch into the set position over
 * `athleticsClock.CROUCH` seconds (`onYourMarks` to `set`), the hold until the
 * `gun`, and with a drive the block exit over its seconds, the rear foot
 * leaving its block (`rearBlockOff`) at the drive's middle and the front at
 * `blockExit`, the end; without a drive the phrase closes a millisecond after
 * the gun. The manner scales the spans it does not fix.
 *
 * @param hold Seconds the set position is held before the gun.
 * @param drive Seconds of the drive out of the blocks; none when absent.
 * @param modifiers The manner's timing.
 * @returns The clock, with the phrase's instants and the start's own.
 */
export function athleticsClock(
  hold: number,
  drive: number | undefined,
  modifiers: IAutoMovieMotionManner.IModifiers,
): IAutoMovieMotionClock {
  const timed: IAutoMovieMotionClock = AutoMovieMotionManner.time(
    AutoMovieMotionClock.phrase({
      prepare: athleticsClock.CROUCH,
      attack: 0,
      hold,
      retract: drive ?? 0.001,
    }),
    modifiers,
  );
  const gun: number = timed.at("relax");
  const end: number = timed.duration;
  return AutoMovieMotionClock(timed.duration, [
    ...timed.instants,
    { name: "onYourMarks", seconds: 0 },
    { name: "set", seconds: timed.at("ready") },
    { name: "gun", seconds: gun },
    ...(drive === undefined
      ? []
      : [
          { name: "rearBlockOff", seconds: gun + (end - gun) / 2 },
          { name: "blockExit", seconds: end },
        ]),
  ]);
}

/** The start's crouch. */
export namespace athleticsClock {
  /** The crouch's seconds (provisional). */
  export const CROUCH: number = 1.5;
}
