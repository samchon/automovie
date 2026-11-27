import type { IAutoMovieMotionClock } from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";

/*
 * A stick stroke's timetable: the hands take the stick over `taken` seconds
 * (`gripped`), then the stroke's swing meets the ball at 55 % of its duration
 * (`stroke`) and ends its follow-through at 85 % (`strokeEnd`), provisional
 * shares of the swing.
 * Parameter taken: Seconds the hands take to reach the grips; 0 when held.
 * Parameter duration: Seconds of the swing.
 * Returns: The clock.
 */
export function stickBallClock(
  taken: number,
  duration: number,
): IAutoMovieMotionClock {
  return AutoMovieMotionClock(taken + duration, [
    { name: "gripped", seconds: taken },
    { name: "stroke", seconds: taken + duration * 0.55 },
    { name: "strokeEnd", seconds: taken + duration * 0.85 },
  ]);
}
