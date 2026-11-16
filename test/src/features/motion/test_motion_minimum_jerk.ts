import { minimumJerk, superposeMinimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

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
 * 6. Scalar-only share evaluates the same specified quintic independently:
 *    quarter/half/three-quarter values are53/512,1/2,459/512 in any query
 *    order. Finite outside values hold; NaN and either infinity refuse.
 * 7. Position-only superposition at0.5s combines half of one unit and53/512
 *    of another, giving(309/128,117/64,587/128)m. Endpoint/reverse reads and
 *    output mutation preserve current points. Empty units still clone the
 *    origin without time admission; invalid durations retain their refusal.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates public full/scalar profiles and complete/position-only superposition. It reads shares, positions, velocities and accelerations and checks current literal points, output ownership and admission: nonzero end derivatives, a wrong scalar polynomial, dropped unit, altered refusal, wrong sign/scale or a boundary seam fails.
 * @evidence contracts/development/testing.md#independent-expectations The quintic s=10u^3-15u^4+6u^5 gives53/512,1/2,459/512 at quarter/half/three-quarter time and s'(1/2)=15/8. Those rational values independently specify the scalar reader rather than copying full.s. At0.5s, adding(2,-2,4)/2 and(4,8,-4)*53/512 to(1,2,3) fixes the literal position. Superposed end states are the origin plus displacements by linearity; continuity is checked against finite differences of the same function.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both scalar/full ends, outside finite values and signed zero, three rational interior values in arbitrary order, NaN/both infinity refusal, a nonzero and a zero redirection, both unit boundaries and invalid duration.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists seven scenarios, full versus scalar/position demand, normalized polynomial/rational values, output ownership, endpoint/admission semantics and the superposed-unit continuity bounds.
 */
export function test_motion_minimum_jerk(): void {
  const close: (a: number, b: number, e?: number) => boolean = (a: number, b: number, e: number = 1e-12): boolean =>
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
  TestValidator.predicate(
    "non-finite time",
    throwsError((): unknown => minimumJerk(NaN)),
  );
  TestValidator.predicate(
    "zero duration",
    throwsError((): unknown =>
      superposeMinimumJerk(origin, [{ ...first, duration: 0 }], 0),
    ),
  );
  for (const [u, expected] of [[0.75, 459 / 512], [0.25, 53 / 512], [0.5, 0.5], [0.75, 459 / 512],
    [-3, 0], [-0, 0], [0, 0], [1, 1], [4, 1]] as const)
    TestValidator.predicate("scalar share keeps the independently evaluated normalized quintic",
      nclose(minimumJerk.share(u), expected, 1e-12),
    );
  for (const u of [NaN, Infinity, -Infinity])
    TestValidator.predicate("scalar share retains finite admission before endpoint hold",
      throwsError((): number => minimumJerk.share(u), "time must be finite"),
    );

  const shifted: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
  const units: readonly superposeMinimumJerk.IUnit[] = [
    { start: 0, duration: 1, displacement: { x: 2, y: -2, z: 4 } },
    { start: 0, duration: 2, displacement: { x: 4, y: 8, z: -4 } },
  ];
  let earlier: IAutoMovieVector3 | undefined;
  for (const [seconds, expected] of [
    [0.5, { x: 309 / 128, y: 117 / 64, z: 587 / 128 }],
    [2, { x: 7, y: 8, z: 3 }], [0, { x: 1, y: 2, z: 3 }],
    [1, { x: 5, y: 4, z: 5 }], [0.5, { x: 309 / 128, y: 117 / 64, z: 587 / 128 }],
  ] as const) {
    const point: IAutoMovieVector3 = superposeMinimumJerk.position(shifted, units, seconds);
    TestValidator.predicate("position-only demand preserves the independent superposition equation",
      vclose(point, expected, 1e-12) && point !== shifted &&
      (earlier === undefined || point !== earlier && earlier.x === 123),
    );
    point.x = 123;
    earlier = point;
  }
  const empty: IAutoMovieVector3 = superposeMinimumJerk.position(shifted, [], NaN);
  TestValidator.predicate("empty position superposition retains fresh origin and no time admission",
    empty !== shifted && vclose(empty, shifted, 0),
  );
  TestValidator.predicate("position-only reads preserve actual per-unit duration admission",
    throwsError((): IAutoMovieVector3 => superposeMinimumJerk.position(shifted,
      [{ ...units[0]!, duration: 0 }], 3), "duration is positive"),
  );
}
