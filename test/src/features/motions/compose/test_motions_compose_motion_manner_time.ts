import type { IAutoMovieMotionClock } from "@automovie/interface";
import {
  motionManner
} from "../../../../../packages/motions/src/compose/internal/motionManner";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { linearMotionClock } from "../../internal/synthetic/linearMotionClock";
import { throwsError } from "../../internal/throwsError";

/** Rounding of a few products and sums of seconds. */
const ROUNDING: number = 1e-12;

/**
 * `motionManner.time` performs a clock in a manner: each span, named
 * by the instant that opens it, is stretched by the hold factor when it is a
 * hold, left as it is when it is fixed and stretched by the tempo otherwise.
 *
 * The input clocks are synthetic (`linearMotionClock`); the expected instants
 * are the authored spans multiplied by their own factors and summed.
 *
 * Scenarios:
 *
 * 1. Spans 0, 2, 2 and 2 s opened by `start`, `move`, `hold` and `recover`, at
 *    tempo 0.5 and hold 2 with `hold` a hold and `recover` fixed: `hold` at 1
 *    s, `recover` at 5 s, the end at 7 s.
 * 2. Without named spans the holds are the clock's `ready` and `strokeEnd`: spans
 *    1, 2 and 1 s at tempo 2 and hold 3 give `ready` at 2 s, `strokeEnd` at 8 s
 *    and the end at 11 s.
 * 3. A tempo and a hold of 1 return the clock itself.
 * 4. A hold the clock lacks is refused.
 */
export function test_motions_compose_motion_manner_time(): void {
  // 1. Named holds and fixed spans.
  const phrase: IAutoMovieMotionClock = linearMotionClock(6, [
    { name: "move", seconds: 0 },
    { name: "hold", seconds: 2 },
    { name: "recover", seconds: 4 },
  ]);
  const timed: IAutoMovieMotionClock = motionManner.time(
    phrase,
    { tempo: 0.5, hold: 2 },
    { holds: ["hold"], fixed: ["recover"] },
  );
  TestValidator.predicate(
    "movement, hold and recovery each take their own factor",
    nclose(timed.at("move"), 0, ROUNDING) &&
      nclose(timed.at("hold"), 1, ROUNDING) &&
      nclose(timed.at("recover"), 5, ROUNDING) &&
      nclose(timed.duration, 7, ROUNDING),
  );

  // 2. The default holds.
  const gesture: IAutoMovieMotionClock = linearMotionClock(4, [
    { name: "ready", seconds: 1 },
    { name: "strokeEnd", seconds: 3 },
  ]);
  const held: IAutoMovieMotionClock = motionManner.time(gesture, {
    tempo: 2,
    hold: 3,
  });
  TestValidator.predicate(
    "ready and strokeEnd open the holds by default",
    nclose(held.at("ready"), 2, ROUNDING) &&
      nclose(held.at("strokeEnd"), 8, ROUNDING) &&
      nclose(held.duration, 11, ROUNDING),
  );

  // 3. No change.
  TestValidator.predicate(
    "unit factors return the clock itself",
    motionManner.time(phrase, { tempo: 1, hold: 1 }) === phrase,
  );

  // 4. An unknown hold.
  TestValidator.predicate(
    "a hold the clock lacks is refused",
    throwsError(() =>
      motionManner.time(
        phrase,
        { tempo: 0.5, hold: 2 },
        { holds: ["pause"] },
      ),
    ),
  );
}
