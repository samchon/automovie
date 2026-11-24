import type { IAutoMovieMotionHumanWalkPace } from "@automovie/interface";
import { WalkPace } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * Rounding of the ramp's bracket: the ramp up's formula meets the trail bound
 * exactly, so its bisection may lengthen it by up to 2^-40 of itself.
 */
const ROUNDING: number = 1e-9;

/** A short step of time to read a speed by a forward difference, seconds. */
const DT: number = 1e-6;

/** How close a forward difference reads a speed, m/s. */
const SPEED: number = 1e-4;

/**
 * `WalkPace` times a stepping gait over a distance and `progress` places the
 * pelvis along it: the landing footprint lies `front` steps ahead of the
 * pelvis, `min(0.5, 1 - share / 2)` with double support and `1 - share / 2 -
 * lead / step` with a flight (Blickhan 1989); the pelvis ramps from its entry
 * speed to the cruise on a smooth step and sheds it over `2 (1 - front)`
 * periods, ending the way at the last heel strike.
 *
 * Scenarios, over 4 m in 4 steps at 1 m/s and a 1 s period, the longest step 1
 * m:
 *
 * 1. With a swing of 0.8 periods: `front` 0.5, the swing 0.8 s, the first toe-off
 *    `FIRST` (0.25 s), the last heel strike `0.25 + 0.8 + 4 = 5.05` s, and the
 *    cruise `4 / (5.05 - (1.1 + 1) / 2) = 1` m/s, the ramp up `2 (0.25 + 0.8 -
 *    0.5) = 1.1` s.
 * 2. The pelvis is at 0 at the start and the whole 4 m at and after the last
 *    heel strike, and starts from rest.
 * 3. Entered at 1.5 m/s it leaves at 1.5 m/s, the cruise lowered to `(4 - 1.5 *
 *    1.1 / 2) / 4 = 0.79375` m/s so it still ends at 4 m.
 * 4. With a swing of 0.999 periods `front` is still half a step; with a flight,
 *    a swing of 1.2 periods and the pressure's middle 0.1 m ahead of the ankle,
 *    it is `1 - 0.6 - 0.1 / 1 = 0.3` steps.
 */
export function test_unit_motions_actions_walk_pace_progress(): void {
  const props = (
    share: number,
    more: Partial<IAutoMovieMotionHumanWalkPace.IProps> = {},
  ): IAutoMovieMotionHumanWalkPace.IProps & { steps: number; longest: number } => ({
    distance: 4,
    speed: 1,
    share,
    period: (): number => 1,
    steps: 4,
    longest: 1,
    ...more,
  });

  // 1. The timing.
  const walk: WalkPace = new WalkPace(props(0.8));
  TestValidator.predicate(
    "the timing",
    walk.steps === 4 &&
      walk.front === 0.5 &&
      nclose(walk.period, 1, ROUNDING) &&
      nclose(walk.swing, 0.8, ROUNDING) &&
      walk.first === WalkPace.FIRST &&
      nclose(walk.last, 5.05, ROUNDING) &&
      nclose(walk.stride, 1, ROUNDING),
  );

  // 2. The way.
  TestValidator.predicate(
    "the way",
    walk.progress(0) === 0 &&
      nclose(walk.progress(walk.last), 4, ROUNDING) &&
      nclose(walk.progress(walk.last + 1), 4, ROUNDING) &&
      walk.progress(DT) / DT <= SPEED,
  );

  // 3. Entered moving.
  const moving: WalkPace = new WalkPace(props(0.8, { entrySpeed: 1.5 }));
  TestValidator.predicate(
    "entered moving",
    nclose(moving.progress(DT) / DT, 1.5, SPEED) &&
      nclose(moving.stride, 0.79375, ROUNDING) &&
      nclose(moving.progress(moving.last), 4, ROUNDING),
  );

  // 4. The landing's lead.
  TestValidator.predicate(
    "double support",
    new WalkPace(props(0.999)).front === 0.5,
  );
  TestValidator.predicate(
    "a flight",
    nclose(new WalkPace(props(1.2, { lead: 0.1 })).front, 0.3, ROUNDING),
  );
}
