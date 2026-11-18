import { dampedSpring, inertializeOffset } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * A critically damped oscillator approaches rest and a closing offset preserves its entry tangent.
 *
 * Scenarios:
 * 1. Compare the interior observation and boundary state with the prescribed continuous law.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A critically damped oscillator approaches rest and a closing offset preserves its entry tangent.
 * @evidence contracts/development/testing.md#independent-expectations The critical solution from unit displacement and zero velocity is (1+2t) exp(-2t); one millisecond first-order steps admit two millimetres of error.
 * @evidence contracts/development/testing.md#distinguishing-cases Boundary and interior inputs distinguish the two behaviors.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_spring_response(): void {
  const entry = inertializeOffset(1, -2, 1, 0);
  const elapsed: number = 1e-6;
  TestValidator.predicate(
    "entry value and tangent",
    nclose(entry.value, 1) &&
      nclose(
        (inertializeOffset(1, -2, 1, elapsed).value - entry.value) / elapsed,
        -2,
        1e-4,
      ),
  );
  const settled = inertializeOffset(1, -2, 1, 2);
  TestValidator.predicate(
    "settled offset",
    nclose(settled.value, 0) && nclose(settled.velocity, 0),
  );
  let state = dampedSpring(1, 0, 0, { stiffness: 4, damping: 4 }, 0.001);
  for (let i = 1; i < 1000; i++)
    state = dampedSpring(
      state.value,
      state.velocity,
      0,
      { stiffness: 4, damping: 4 },
      0.001,
    );
  TestValidator.predicate(
    "critical damping at one second",
    nclose(state.value, 3 * Math.exp(-2), 0.002) &&
      nclose(state.velocity, -4 * Math.exp(-2), 0.002),
  );
}
