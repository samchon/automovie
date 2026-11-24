import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../internal/PhysicalDisturbance";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/**
 * The independent four-support primitive, under the same internal actuation as
 * the Human, meets a 0.1 s push half its in-place bound, forward and sideways,
 * and holds it without a step: never tipped, every support flat and only the
 * supports on the floor, until the capture point is back inside the support
 * and coming back; the record's momentum matches the floor's load, its contacts
 * lie on the bones they name and no support wrench exceeds its bound
 * (`PhysicalDisturbance.verify`).
 *
 * Scenarios:
 *
 * 1. Forward, z: no step.
 * 2. Sideways, x: no step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pushes, the verdict and the audit each run must pass.
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` on the maintained four-support fixture from a 0.1 s quiet prefix in checkpoint-aligned chunks until decided, and reads the recovery record, frames, floor receipts and support wrenches.
 * @evidence contracts/development/testing.md#independent-expectations The pushes come from the inverted pendulum (Hof, Gazendam and Sinke 2005) with the fixture's own mass, height and support outlines; the momentum audit is Newton's second law within #3092's 2 percent.
 * @evidence contracts/development/testing.md#distinguishing-cases A controller that steps needlessly fails here; the siblings past the in-place and any-step bounds are `test_physical_disturbance_primitive_recover` and `test_physical_disturbance_primitive_fall`.
 * @evidence contracts/development/testing.md#execution-ownership Builds the fixture in memory and runs two short native simulations with no viewer or file host.
 */
export async function test_physical_disturbance_primitive_sustained(): Promise<void> {
  const failures: string[] = [];
  const subject: PhysicalDisturbance.ISubject = PhysicalDisturbance.planted(
    PhysicalModelFixtures.quadrupod(),
  );
  for (const axis of ["z", "x"] as const)
    await PhysicalDisturbance.verify(subject, "sustained", axis, failures);
  TestValidator.equals("four-support sustained disturbance", failures, []);
}
