import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../internal/PhysicalDisturbance";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The canonical Human, standing in its public Stand under internal actuation
 * only, meets a 0.1 s push half the in-place bound, forward and sideways, and
 * holds it without a step: the root never tipped, every sole flat and only the
 * feet on the floor throughout, until the capture point is back inside the
 * support and coming back. The run records the body's momentum against the
 * floor's load, the contacts' provenance and the support wrenches' bound
 * (`PhysicalDisturbance.verify`, `.judge`, `.audit`). The push is stated from
 * the body's own inverted pendulum.
 *
 * Scenarios:
 *
 * 1. Forward, z: no step, decided once the capture point returns inside.
 * 2. Sideways, x: the same across the stance width.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the push, the verdict and the audit each run must pass.
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` from a 0.1 s quiet prefix in checkpoint-aligned chunks until the verdict is decided, and reads the recovery record, frames, floor receipts and support wrenches.
 * @evidence contracts/development/testing.md#independent-expectations The push comes from the inverted pendulum (Hof, Gazendam and Sinke 2005) with the body's own mass, height and sole outlines; the floor load is checked by Newton's second law against the body's momentum within #3092's 2 percent, not from the controller's assessment.
 * @evidence contracts/development/testing.md#distinguishing-cases A controller that steps needlessly fails here; its siblings push past the in-place bound (`test_physical_disturbance_human_recover`) and past the any-step bound (`test_physical_disturbance_human_fall`); the verdict's own cases are `test_physical_disturbance_verdicts`.
 * @evidence contracts/development/testing.md#execution-ownership Builds the performance in memory and runs two short native simulations with no viewer or file host.
 */
export async function test_physical_disturbance_human_sustained(): Promise<void> {
  const failures: string[] = [];
  const subject: PhysicalDisturbance.ISubject = PhysicalDisturbance.standing(
    motionHumanBody("m-average"),
  );
  for (const axis of ["z", "x"] as const)
    await PhysicalDisturbance.verify(subject, "sustained", axis, failures);
  TestValidator.equals("Human sustained disturbance", failures, []);
}
