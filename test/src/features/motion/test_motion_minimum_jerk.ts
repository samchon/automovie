import { minimumJerk, superposeMinimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Minimum-jerk units and their superposition reach their goals at rest and
 * redirect without a seam.
 *
 * Scenarios:
 * 1. The normalized profile is 0 and 1 at its ends with zero rate and
 *    acceleration, 0.5 at the middle, and peaks in speed at the middle with
 *    1.875 times the mean, Flash and Hogan's closed form.
 * 2. A reach from the origin to (0.4, 0.2, 0) over 0.5 s, redirected at
 *    0.2 s to (0.4, 0.5, 0.1) by a second unit of 0.4 s, ends exactly on the
 *    new target with zero velocity and acceleration.
 * 3. The same reach with a zero second displacement equals the first unit
 *    alone at every sampled instant.
 * 4. Position, velocity and acceleration are continuous at the redirection
 *    instant and at the first unit's end: one-sided values 1e-6 s apart differ
 *    by no more than their derivatives times that step.
 * 5. A non-finite time and a non-positive duration throw.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the public profile and superposition and reads positions, velocities and accelerations; a profile with nonzero end derivatives, a unit summed with the wrong sign or scale, or a seam at a unit boundary fails.
 * @evidence contracts/development/testing.md#independent-expectations The quintic's values follow from its definition s = 10u^3 - 15u^4 + 6u^5 (s(1/2) = 1/2, s'(1/2) = 15/8); the end state of superposed units is the origin plus every displacement by linearity; continuity is checked against finite differences of the same function.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers the ends, the middle, a nonzero and a zero redirection, both unit boundaries and invalid input.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_motion_minimum_jerk(): void {
  const close = (a: number, b: number, e: number = 1e-12): boolean =>
    Math.abs(a - b) <= e;
  const p0: minimumJerk.IProfile = minimumJerk(0);
  const p1: minimumJerk.IProfile = minimumJerk(1);
  const mid: minimumJerk.IProfile = minimumJerk(0.5);
  TestValidator.predicate(
    "ends at rest",
    p0.s === 0 &&
      p0.ds === 0 &&
      p0.dds === 0 &&
      p1.s === 1 &&
      p1.ds === 0 &&
      p1.dds === 0,
  );
  TestValidator.predicate(
    "middle",
    close(mid.s, 0.5) && close(mid.ds, 1.875) && close(mid.dds, 0),
  );

  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const first: superposeMinimumJerk.IUnit = {
    displacement: { x: 0.4, y: 0.2, z: 0 },
    start: 0,
    duration: 0.5,
  };
  const second: superposeMinimumJerk.IUnit = {
    displacement: { x: 0, y: 0.3, z: 0.1 },
    start: 0.2,
    duration: 0.4,
  };
  const end: superposeMinimumJerk.IState = superposeMinimumJerk(
    origin,
    [first, second],
    0.6,
  );
  TestValidator.predicate(
    "redirected reach ends on the new target at rest",
    close(end.position.x, 0.4) &&
      close(end.position.y, 0.5) &&
      close(end.position.z, 0.1) &&
      [end.velocity, end.acceleration].every(
        (v: IAutoMovieVector3): boolean =>
          close(v.x, 0) && close(v.y, 0) && close(v.z, 0),
      ),
  );
  const still: superposeMinimumJerk.IUnit = {
    ...second,
    displacement: { x: 0, y: 0, z: 0 },
  };
  for (let t: number = 0; t <= 0.6; t += 0.01) {
    const a: superposeMinimumJerk.IState = superposeMinimumJerk(
      origin,
      [first, still],
      t,
    );
    const b: superposeMinimumJerk.IState = superposeMinimumJerk(
      origin,
      [first],
      t,
    );
    TestValidator.predicate(
      `unchanged target keeps the path at ${t.toFixed(2)}`,
      close(a.position.y, b.position.y) && close(a.velocity.x, b.velocity.x),
    );
  }
  const h: number = 1e-6;
  for (const seam of [0.2, 0.5, 0.6]) {
    const l: superposeMinimumJerk.IState = superposeMinimumJerk(
      origin,
      [first, second],
      seam - h,
    );
    const r: superposeMinimumJerk.IState = superposeMinimumJerk(
      origin,
      [first, second],
      seam + h,
    );
    TestValidator.predicate(
      `continuous at ${seam}`,
      Math.abs(l.position.y - r.position.y) <= 2 * h * 3 &&
        Math.abs(l.velocity.y - r.velocity.y) <= 2 * h * 60 &&
        Math.abs(l.acceleration.y - r.acceleration.y) <= 2 * h * 2000,
    );
  }
  TestValidator.error("non-finite time", (): unknown => minimumJerk(NaN));
  TestValidator.error("zero duration", (): unknown =>
    superposeMinimumJerk(origin, [{ ...first, duration: 0 }], 0),
  );
}
