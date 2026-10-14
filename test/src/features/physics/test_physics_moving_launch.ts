import {
  projectileAt,
  solveBallisticLaunch,
  solveMovingLaunch,
} from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

const GRAVITY: IAutoMovieVector3 = { x: 0, y: -9.81, z: 0 };

/**
 * A settled moving-target lead meets the target at its returned flight time;
 * a capped, unsettled lead remains a best visited candidate rather than a
 * guaranteed intercept for an arbitrary target callback.
 *
 * Scenarios:
 *
 * 1. A stationary target reduces to the static solve: same velocity and hit time
 *    as `solveBallisticLaunch` on that point.
 * 2. A target sliding downrange is led: the baked flight meets `targetAt(hitTime)`
 *    to millimetres.
 * 3. Capping the iterations returns the best-so-far solve (a partial lead that has
 *    not settled), not null.
 * 4. A target that outruns the shot at the given speed → null (out of range at
 *    some iterate).
 * 5. A non-positive speed → null.
 *
 * @evidence contracts/testing.md#behavioral-verification Solves stationary and sliding targets, checks static parity and physical interception, distinguishes a partial one-step lead and requires null for the authored out-of-range and zero-speed requests.
 * @evidence contracts/testing.md#independent-expectations Constant-acceleration displacement and requested speed independently constrain the stationary result, and direct substitution checks the sliding intercept. Static-solver parity and projectileAt are supplemental shared-dependency checks; arbitrary callback convergence is not certified.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts stationary, slower downrange motion, a one-step unsettled cap, an authored faster out-of-range target and zero speed; closest-visited selection and invalid iteration/vector admission belong to neighboring units.
 * @evidence contracts/testing.md#execution-ownership The named exported portable unit owns every case and calls launch/state functions with local target callbacks, without hosts or dynamically registered tests.
 */
export function test_physics_moving_launch(): void {
  const origin: IAutoMovieVector3 = { x: 0, y: 1.6, z: 0 };

  // 1. stationary → the static solve
  const still: IAutoMovieVector3 = { x: 7, y: 1, z: 2 };
  const moving: NonNullable<ReturnType<typeof solveMovingLaunch>> =
    solveMovingLaunch(origin, (): IAutoMovieVector3 => still, 16)!;
  const staticSol: NonNullable<ReturnType<typeof solveBallisticLaunch>> =
    solveBallisticLaunch(origin, still, 16)!;
  TestValidator.predicate(
    "a stationary target reduces to the static solve",
    vclose(moving.velocity, staticSol.velocity, 1e-6) &&
      nclose(moving.hitTime, staticSol.hitTime, 1e-6),
  );
  TestValidator.predicate(
    "stationary launch independently satisfies displacement and requested speed",
    moving.hitTime > 0 &&
      nclose(
        Math.hypot(moving.velocity.x, moving.velocity.y, moving.velocity.z),
        16,
        1e-6,
      ) &&
      vclose(
        {
          x: moving.velocity.x * moving.hitTime,
          y:
            moving.velocity.y * moving.hitTime -
            (9.81 * moving.hitTime ** 2) / 2,
          z: moving.velocity.z * moving.hitTime,
        },
        { x: 7, y: -0.6, z: 2 },
        1e-6,
      ),
  );

  // 2. a target sliding downrange (+x at 3 m/s) is led onto the meeting point
  const slide: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 => ({
    x: 6 + 3 * t,
    y: 1,
    z: 0,
  });
  const lead: NonNullable<ReturnType<typeof solveMovingLaunch>> =
    solveMovingLaunch(origin, slide, 20)!;
  const meet: IAutoMovieVector3 = projectileAt(
    { origin, velocity: lead.velocity, gravity: GRAVITY },
    lead.hitTime,
  ).position;
  TestValidator.predicate(
    "the led flight meets the target where it will be",
    vclose(meet, slide(lead.hitTime), 1e-3),
  );
  TestValidator.predicate(
    "the sliding intercept independently follows constant acceleration",
    vclose(
      {
        x: lead.velocity.x * lead.hitTime,
        y:
          1.6 + lead.velocity.y * lead.hitTime - (9.81 * lead.hitTime ** 2) / 2,
        z: lead.velocity.z * lead.hitTime,
      },
      slide(lead.hitTime),
      1e-3,
    ),
  );
  TestValidator.predicate(
    "the intercept is ahead of the start",
    lead.hitTime > 0,
  );

  // 3. one iteration returns the best-so-far solve (an unsettled partial lead)
  const partial: ReturnType<typeof solveMovingLaunch> = solveMovingLaunch(
    origin,
    slide,
    20,
    GRAVITY,
    "direct",
    1,
  );
  TestValidator.predicate(
    "capped iterations still return a solve",
    partial !== null,
  );
  TestValidator.predicate(
    "and the partial lead has not fully settled onto the meeting point",
    partial !== null && !nclose(partial.hitTime, lead.hitTime, 1e-6),
  );

  // 4. a target that outruns the shot → out of range → null
  const flee: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 => ({
    x: 40 + 30 * t,
    y: 1,
    z: 0,
  });
  TestValidator.equals(
    "a target that outruns the shot → null",
    solveMovingLaunch(origin, flee, 10),
    null,
  );

  // 5. a non-positive speed → null
  TestValidator.equals(
    "a non-positive speed → null",
    solveMovingLaunch(origin, (): IAutoMovieVector3 => still, 0),
    null,
  );
}
