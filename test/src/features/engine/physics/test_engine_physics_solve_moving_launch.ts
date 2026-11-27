import { AutoMovieEngineGravity, AutoMovieEngineAir } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";
import { nclose, vclose } from "../../internal/predicates";

/**
 * How far a led flight may meet its moving target off the target, metres: the
 * fixed point settles its flight time to a microsecond, which a target sliding
 * 3 m/s and a launch of 20 m/s turn into well under a millimetre.
 */
const MEETING: number = 1e-3;

/** Earth's gravity as the solvers default it. */
const GRAVITY: IAutoMovieVector3 = AutoMovieEngineGravity.DOWN;

/** Where the shot leaves, metres. */
const ORIGIN: IAutoMovieVector3 = { x: 0, y: 1.6, z: 0 };

/** Where a flight is after `t` seconds under standard gravity. */
function flown(velocity: IAutoMovieVector3, t: number): IAutoMovieVector3 {
  return {
    x: ORIGIN.x + velocity.x * t,
    y: ORIGIN.y + velocity.y * t - (AutoMovieEngineGravity.STANDARD * t * t) / 2,
    z: ORIGIN.z + velocity.z * t,
  };
}

/**
 * `solveMovingLaunch` leads a moving target by fixed-point iteration on the
 * flight time: each guess aims the static solve at where the target will be,
 * and the iterate whose time moved least is returned, null where some iterate
 * is out of range.
 *
 * Scenarios, from (0, 1.6, 0):
 *
 * 1. A target held at (7, 1, 2) at speed 16 gives the static solve, whose flight
 *    lands on it at speed 16.
 * 2. A target sliding `x = 6 + 3 t` at speed 20 is met where it will be, by the
 *    constant-acceleration flight; one iteration returns an unsettled lead; an
 *    iteration count below one is null.
 * 3. A target accelerating away, `x = 20 + 5 t^2`, at speed 20: the times from the
 *    closed-form lower root `t^2 = 2 d^2 / (l + sqrt(l^2 - g^2 d^2))`, `l =
 *    s^2
 *
 *    - G dy`, iterated four times from `|d| / s`, move least before the last, and a
 *         four-iteration cap returns that closest one.
 * 4. A target fleeing at 30 m/s from 40 m at speed 10, and a zero speed, are null.
 */
export function test_engine_physics_solve_moving_launch(): void {
  // 1. A held target.
  const still: IAutoMovieVector3 = { x: 7, y: 1, z: 2 };
  const held = AutoMovieEngineAir.solveMovingLaunch(ORIGIN, (): IAutoMovieVector3 => still, 16)!;
  const fixed = AutoMovieEngineAir.solveBallisticLaunch(ORIGIN, still, 16)!;
  TestValidator.predicate(
    "a held target",
    vclose(held.velocity, fixed.velocity, PhysicalTolerance.CONVERGED) &&
      nclose(held.hitTime, fixed.hitTime, PhysicalTolerance.CONVERGED) &&
      nclose(
        Math.hypot(held.velocity.x, held.velocity.y, held.velocity.z),
        16,
        PhysicalTolerance.CONVERGED,
      ) &&
      vclose(
        flown(held.velocity, held.hitTime),
        still,
        PhysicalTolerance.CONVERGED,
      ),
  );

  // 2. A sliding target.
  const slide = (t: number): IAutoMovieVector3 => ({
    x: 6 + 3 * t,
    y: 1,
    z: 0,
  });
  const lead = AutoMovieEngineAir.solveMovingLaunch(ORIGIN, slide, 20)!;
  const partial = AutoMovieEngineAir.solveMovingLaunch(ORIGIN, slide, 20, GRAVITY, "direct", 1);
  TestValidator.predicate(
    "a sliding target",
    lead.hitTime > 0 &&
      vclose(
        flown(lead.velocity, lead.hitTime),
        slide(lead.hitTime),
        MEETING,
      ) &&
      partial !== null &&
      partial.hitTime > 0 &&
      !nclose(partial.hitTime, lead.hitTime, PhysicalTolerance.CONVERGED),
  );
  TestValidator.equals(
    "no iteration",
    [0, -1].map((iterations: number) =>
      AutoMovieEngineAir.solveMovingLaunch(ORIGIN, slide, 20, GRAVITY, "direct", iterations),
    ),
    [null, null],
  );

  // 3. The closest iterate.
  const accel = (t: number): IAutoMovieVector3 => ({
    x: 20 + 5 * t * t,
    y: 1,
    z: 0,
  });
  let guess: number = Math.hypot(20, 1 - ORIGIN.y) / 20;
  const iterates: { hitTime: number; residual: number }[] = [];
  for (let i: number = 0; i < 4; ++i) {
    const at: IAutoMovieVector3 = accel(guess);
    const d2: number = at.x ** 2 + (at.y - ORIGIN.y) ** 2 + at.z ** 2;
    const linear: number = 400 - 9.81 * (at.y - ORIGIN.y);
    const hitTime: number = Math.sqrt(
      (2 * d2) / (linear + Math.sqrt(linear ** 2 - 9.81 ** 2 * d2)),
    );
    iterates.push({ hitTime, residual: Math.abs(hitTime - guess) });
    guess = hitTime;
  }
  const closest = iterates.reduce((a, b) => (b.residual < a.residual ? b : a));
  const last = iterates[3]!;
  // The closed form above reads g as 9.81, so the solve does too.
  const capped = AutoMovieEngineAir.solveMovingLaunch(
    ORIGIN,
    accel,
    20,
    { x: 0, y: -9.81, z: 0 },
    "direct",
    4,
  );
  TestValidator.predicate(
    "the closest iterate",
    closest !== last &&
      capped !== null &&
      nclose(capped.hitTime, closest.hitTime, PhysicalTolerance.ACCUMULATED) &&
      !nclose(capped.hitTime, last.hitTime, PhysicalTolerance.CONVERGED),
  );

  // 4. Unreachable.
  TestValidator.equals(
    "unreachable",
    [
      AutoMovieEngineAir.solveMovingLaunch(
        ORIGIN,
        (t: number): IAutoMovieVector3 => ({ x: 40 + 30 * t, y: 1, z: 0 }),
        10,
      ),
      AutoMovieEngineAir.solveMovingLaunch(ORIGIN, (): IAutoMovieVector3 => still, 0),
    ],
    [null, null],
  );
}
