import type {
  IAutoMovieResolveContactEvents,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPerformanceContactSpeed } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * How far a rate bound may stand from its closed form, metres a second: a
 * difference of squares over a quarter second, far above its rounding.
 */
const RATE: number = 1e-12;

/** A point on `+X`. */
const X = (x: number): IAutoMovieVector3 => ({ x, y: 0, z: 0 });

/**
 * `HumanPerformanceContactSpeed.weapon` bounds a weapon's speed between grid
 * seconds of its live window by the most either end of its axis moves between
 * neighbouring grid seconds over their interval.
 *
 * Scenarios, on a grid from 0 to 1 s in quarter seconds:
 *
 * 1. A centre at `t²` moves `t_k + t_(k+1)` per second between neighbours: 0.25,
 *    0.75, 1.25 and 1.75. An ask from 0 to 0.5 s bounds 0.75; from 0.25 to 1 s,
 *    1.75; an ask starting earlier than the last restarts its rates, 0.75 again.
 * 2. A capsule's far end at `3t` along `+Y` moves faster than its centre and
 *    bounds 3.
 * 3. A second off the grid, or before the live start, has no bound; one at or
 *    past the window's last grid second has 0.
 * 4. A window ending at 0.6 s stops at its last grid second, 0.5 s: an ask to 1 s
 *    bounds 0.75.
 * 5. A grid ending at 0.9 s has its last interval of 0.15 s, (0.81 − 0.5625) /
 *    0.15 = 1.65 m/s.
 */
export function test_motions_perform_contact_speed(): void {
  const grid: IAutoMovieResolveContactEvents.IGrid = {
    from: 0,
    to: 1,
    step: 0.25,
  };
  const squared = (t: number): readonly [IAutoMovieVector3, undefined] => [
    X(t * t),
    undefined,
  ];

  // 1. Neighbouring rates.
  const speed = HumanPerformanceContactSpeed.weapon(squared, 0, 1, grid);
  TestValidator.predicate(
    "the most a centre moves between neighbours",
    near(speed(0, 0.5), 0.75) &&
      near(speed(0.25, 1), 1.75) &&
      near(speed(0.5, 0.75), 1.25) &&
      near(speed(0, 0.5), 0.75),
  );
  const restarted = HumanPerformanceContactSpeed.weapon(squared, 0, 1, grid);
  TestValidator.predicate(
    "an earlier ask restarts its rates",
    near(restarted(0.5, 0.75), 1.25) && near(restarted(0.25, 0.5), 0.75),
  );

  // 2. A capsule.
  const capsule = HumanPerformanceContactSpeed.weapon(
    (t: number): readonly [IAutoMovieVector3, IAutoMovieVector3] => [
      X(t * t),
      { x: 0, y: 3 * t, z: 0 },
    ],
    0,
    1,
    grid,
  );
  TestValidator.predicate("the far end bounds", near(capsule(0, 1), 3));

  // 3. Off the grid, early and late.
  const late = HumanPerformanceContactSpeed.weapon(squared, 0.5, 1, grid);
  TestValidator.predicate(
    "seconds without a bound or with none to bound",
    speed(0.1, 1) === undefined &&
      late(0.25, 1) === undefined &&
      speed(1, 1) === 0 &&
      near(late(0.5, 1), 1.75),
  );

  // 4. A shorter window.
  const short = HumanPerformanceContactSpeed.weapon(squared, 0, 0.6, grid);
  TestValidator.predicate(
    "the window's last grid second",
    near(short(0, 1), 0.75) && short(0.5, 1) === 0,
  );

  // 5. A short last interval.
  const clipped = HumanPerformanceContactSpeed.weapon(squared, 0, 0.9, {
    from: 0,
    to: 0.9,
    step: 0.25,
  });
  TestValidator.predicate(
    "the grid's clipped end",
    near(clipped(0.75, 0.9), 1.65) && clipped(0.9, 0.9) === 0,
  );
}

/** Whether a bound is the expected rate. */
function near(actual: number | undefined, expected: number): boolean {
  return actual !== undefined && Math.abs(actual - expected) <= RATE;
}
