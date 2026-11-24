import {
  physicalQuadrupedDcmController,
  physicalQuadrupedStep,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { vclose } from "../internal/vclose";

/**
 * The quadruped DCM controller places the virtual repellent point so the DCM
 * converges to its plan as IHMC's `DivergentComponentOfMotionController` does
 * (l.92-98): vrp = xi - (xi_d' + K_p (xi_d - xi)) / omega with K_p = (1, 1,
 * 0).
 *
 * Scenarios, omega = 3 per second:
 *
 * 1. Sign and gain: a DCM 0.1 m ahead of a resting plan in x puts the point 0.1 /
 *    3 m further ahead, so the pendulum's xi' = omega (xi - vrp) is -0.1 m/s,
 *    the gain times the error, back toward the plan.
 * 2. Feed-forward: on the plan, the point is the perfect pivot xi_d - xi_d' /
 *    omega.
 * 3. The vertical gain is zero: a 0.05 m height error moves no point, which only
 *    follows the planned vertical rate.
 * 4. A gain of 2 in y doubles the lateral correction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law, its gains and each scenario's expected point.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the controller and reads the point it returns, checking the closed loop's DCM rate.
 * @evidence contracts/development/testing.md#independent-expectations The points follow the reference's law by hand, and scenario 1 checks the resulting rate against the pendulum's dynamics xi' = omega (xi - vrp).
 * @evidence contracts/development/testing.md#distinguishing-cases A flipped sign moves the point toward the plan in 1; a missing feed-forward fails 2; a vertical gain of one fails 3; an ignored gain override fails 4.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on in-memory vectors.
 */
export function test_physical_quadruped_dcm_controller(): void {
  const omega: number = 3;
  const rest: physicalQuadrupedStep.IPoint = { x: 0, y: 0, z: 0 };

  // 1. Ahead in x: the point lies further ahead and the DCM returns at the
  //    gain times the error.
  const estimate: physicalQuadrupedStep.IPoint = { x: 0.1, y: 0, z: 0.5 };
  const vrp: physicalQuadrupedStep.IPoint = physicalQuadrupedDcmController({
    estimate,
    desired: { x: 0, y: 0, z: 0.5 },
    desiredVelocity: rest,
    omega,
  });
  TestValidator.predicate(
    "ahead",
    vclose(vrp, { x: 0.1 + 0.1 / 3, y: 0, z: 0.5 }, 1e-12),
  );
  TestValidator.predicate(
    "returning rate",
    nclose(omega * (estimate.x - vrp.x), -0.1, 1e-12),
  );

  // 2. On the plan the point is the perfect pivot.
  const desired: physicalQuadrupedStep.IPoint = { x: 0.2, y: -0.1, z: 0.45 };
  TestValidator.predicate(
    "feed-forward",
    vclose(
      physicalQuadrupedDcmController({
        estimate: desired,
        desired,
        desiredVelocity: { x: 0.3, y: 0.06, z: 0 },
        omega,
      }),
      { x: 0.2 - 0.1, y: -0.1 - 0.02, z: 0.45 },
      1e-12,
    ),
  );

  // 3. A height error moves nothing; the planned vertical rate does.
  TestValidator.predicate(
    "vertical",
    vclose(
      physicalQuadrupedDcmController({
        estimate: { x: 0, y: 0, z: 0.55 },
        desired: { x: 0, y: 0, z: 0.5 },
        desiredVelocity: { x: 0, y: 0, z: 0.03 },
        omega,
      }),
      { x: 0, y: 0, z: 0.55 - 0.01 },
      1e-12,
    ),
  );

  // 4. A gain of 2 in y doubles the lateral correction.
  TestValidator.predicate(
    "gain",
    nclose(
      physicalQuadrupedDcmController({
        estimate: { x: 0, y: -0.06, z: 0.5 },
        desired: { x: 0, y: 0, z: 0.5 },
        desiredVelocity: rest,
        omega,
        gains: { y: 2 },
      }).y,
      -0.06 - (2 * 0.06) / 3,
      1e-12,
    ),
  );
}
