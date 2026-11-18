import {
  carriedAcceleration,
  carriedRate,
  dampedSpring,
  inertializeOffset,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * A critically damped oscillator approaches rest and a closing offset preserves its entry tangent.
 *
 * Scenarios:
 * 1. Compare the damped response and the closing offset with the prescribed continuous law.
 * 2. Measure the Hermite rate and acceleration bases at both cuts, outside their interval and at the analytically determined extrema.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A critically damped oscillator approaches rest and a closing offset preserves its entry tangent.
 * @evidence contracts/development/testing.md#independent-expectations The critical solution from unit displacement and zero velocity is (1+2t) exp(-2t); one millisecond first-order steps admit two millimetres of error.
 * @evidence contracts/development/testing.md#distinguishing-cases Boundary and interior inputs distinguish the two behaviors.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_spring_response(): void {
  const duration: number = 0.4;
  for (const basis of [carriedRate, carriedAcceleration]) {
    for (const time of [-duration, 0, duration, 2 * duration])
      TestValidator.predicate(
        "no carried offset outside the open interval",
        nclose(basis(duration, time), 0, 1e-15),
      );
    TestValidator.predicate(
      "duration must be positive",
      throwsError(() => basis(0, duration)),
    );
    TestValidator.predicate(
      "elapsed seconds must be finite",
      throwsError(() => basis(duration, NaN)),
    );
  }
  const h: number = 1e-5;
  TestValidator.predicate(
    "unit entry rate and zero exit rate",
    nclose(carriedRate(duration, h) / h, 1, 1e-6) &&
      nclose(carriedRate(duration, duration - h) / h, 0, 1e-6),
  );
  for (const [time, curvature] of [
    [h, 1],
    [duration - h, 0],
  ] as const) {
    const secondDifference: number =
      (carriedAcceleration(duration, time + h) -
        2 * carriedAcceleration(duration, time) +
        carriedAcceleration(duration, time - h)) /
      (h * h);
    TestValidator.predicate(
      "unit entry acceleration and zero exit acceleration",
      nclose(secondDifference, curvature, 1e-2),
    );
    TestValidator.predicate(
      "zero endpoint rate for the acceleration basis",
      nclose(
        (carriedAcceleration(duration, time + h) -
          carriedAcceleration(duration, time - h)) /
          (2 * h),
        0,
        1e-3,
      ),
    );
    const rateCurvature: number =
      (carriedRate(duration, time + h) -
        2 * carriedRate(duration, time) +
        carriedRate(duration, time - h)) /
      (h * h);
    TestValidator.predicate(
      "no carried acceleration in the rate basis",
      nclose(rateCurvature, 0, 1e-2),
    );
  }
  TestValidator.predicate(
    "rate peak at one third",
    nclose(carriedRate.PEAK, 16 / 81, 1e-15) &&
      nclose(carriedRate(duration, duration / 3), (duration * 16) / 81, 1e-12),
  );
  TestValidator.predicate(
    "acceleration peak at two fifths",
    nclose(carriedAcceleration.PEAK, 54 / 3125, 1e-15) &&
      nclose(
        carriedAcceleration(duration, (2 * duration) / 5),
        (duration ** 2 * 54) / 3125,
        1e-12,
      ),
  );
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
