import { minimumJerk, superposeMinimumJerk } from "@automovie/engine";
import type { IAutoMovieSuperposeMinimumJerk } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../../features/internal/nclose";
import { throwsError } from "../../../../features/internal/throwsError";

/**
 * Minimum-jerk root travel hands off position and velocity at a direction change.
 *
 * Scenarios:
 * 1. Compare the interior observation and boundary state with the prescribed continuous law.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Minimum-jerk root travel hands off position and velocity at a direction change.
 * @evidence contracts/development/testing.md#independent-expectations The unit quintic reaches half height at one half with derivative 15/8; a two-metre excursion doubles that derivative.
 * @evidence contracts/development/testing.md#distinguishing-cases Boundary and interior inputs distinguish the two behaviors.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_root_interpolation(): void {
  const origin = { x: 3, y: 2, z: 1 };
  for (const t of [-1, 0, 0.25, 0.5, 0.75, 1, 2]) {
    const u = Math.max(0, Math.min(1, t));
    const share = u ** 3 * (10 - 15 * u + 6 * u * u);
    TestValidator.predicate(
      "normalized integral and its derivative",
      nclose(minimumJerk.share(t), share, 1e-12) &&
        nclose(minimumJerk.rate(t), 30 * u * u * (1 - u) ** 2, 1e-12),
    );
  }
  for (const t of [NaN, Infinity, -Infinity])
    TestValidator.predicate(
      "finite normalized time",
      throwsError(() => minimumJerk.share(t)) &&
        throwsError(() => minimumJerk.rate(t)),
    );
  const empty = superposeMinimumJerk.position(origin, [], NaN);
  TestValidator.predicate(
    "an empty sum owns the unchanged origin",
    empty !== origin && empty.x === 3 && empty.y === 2 && empty.z === 1,
  );
  const units: IAutoMovieSuperposeMinimumJerk.IUnit[] = [
    { start: 0, duration: 1, displacement: { x: 2, y: 0, z: 0 } },
    { start: 1, duration: 1, displacement: { x: 0, y: -1, z: 0 } },
  ];
  const at = (t: number): IAutoMovieSuperposeMinimumJerk.IState =>
    superposeMinimumJerk({ x: 3, y: 2, z: 1 }, units, t);
  const early: IAutoMovieSuperposeMinimumJerk.IUnit = {
    ...units[1]!,
    start: 0.25,
  };
  const overlapping = [units[0]!, early];
  const point = superposeMinimumJerk.position(origin, overlapping, 0.5);
  TestValidator.predicate(
    "overlap adds two independently phased displacements",
    nclose(point.x, 4, 1e-12) && nclose(point.y, 2 - 53 / 512, 1e-12),
  );
  point.x = 100;
  TestValidator.predicate(
    "reads own their returned position",
    superposeMinimumJerk.position(origin, overlapping, 0.5).x === 4 &&
      origin.x === 3,
  );
  TestValidator.predicate(
    "zero-duration units refused by both readers",
    throwsError(() =>
      superposeMinimumJerk.position(origin, [{ ...early, duration: 0 }], 1),
    ) &&
      throwsError(() =>
        superposeMinimumJerk(origin, [{ ...early, duration: 0 }], 1),
      ),
  );
  const h = 1e-6;
  for (const seam of [0.25, 1, 1.25]) {
    const left = superposeMinimumJerk(origin, overlapping, seam - h);
    const right = superposeMinimumJerk(origin, overlapping, seam + h);
    for (const axis of ["x", "y"] as const)
      TestValidator.predicate(
        "overlapping units hand off position, velocity and acceleration",
        Math.abs(left.position[axis] - right.position[axis]) <= 2 * h * 4 &&
          Math.abs(left.velocity[axis] - right.velocity[axis]) <= 2 * h * 60 &&
          Math.abs(left.acceleration[axis] - right.acceleration[axis]) <=
            2 * h * 2000,
      );
  }
  for (const [t, x, y, vx] of [
    [0, 3, 2, 0],
    [0.5, 4, 2, 3.75],
    [1, 5, 2, 0],
    [2, 5, 1, 0],
    [1e9, 5, 1, 0],
  ] as const) {
    const state = at(t);
    TestValidator.predicate(
      "position and physical-time tangent",
      nclose(state.position.x, x) &&
        nclose(state.position.y, y) &&
        nclose(state.velocity.x, vx),
    );
  }
  TestValidator.predicate(
    "C1 handoff",
    Math.abs(at(1 - 1e-5).velocity.x) < 1e-7 &&
      Math.abs(at(1 + 1e-5).velocity.y) < 1e-7,
  );
}
