import { superposeMinimumJerk } from "@automovie/engine";
import type { IAutoMovieSuperposeMinimumJerk } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

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
  const units: IAutoMovieSuperposeMinimumJerk.IUnit[] = [
    { start: 0, duration: 1, displacement: { x: 2, y: 0, z: 0 } },
    { start: 1, duration: 1, displacement: { x: 0, y: -1, z: 0 } },
  ];
  const at = (t: number): IAutoMovieSuperposeMinimumJerk.IState =>
    superposeMinimumJerk({ x: 3, y: 2, z: 1 }, units, t);
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
