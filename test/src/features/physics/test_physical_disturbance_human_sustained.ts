import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../internal/PhysicalDisturbance";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The canonical Human, standing in its public Stand under internal actuation
 * only, meets a 0.1 s push half the in-place bound, forward and sideways:
 * no step, still supported and not tipped, every sole flat throughout, the
 * height kept and the floor load back at the weight within 2 percent. The
 * push is stated from the body's own inverted pendulum (`PhysicalDisturbance`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the push and every condition the outcome must meet.
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` on the public Stand handed over through `fitHumanPhysicalStandingPose` and reads the recovery record, cache frames, contact receipts and support wrenches.
 * @evidence contracts/development/testing.md#independent-expectations The push comes from the inverted pendulum (Hof, Gazendam and Sinke 2005) with the body's own mass, height and sole outlines and the declared step reach and timing, not from the controller's assessment.
 * @evidence contracts/development/testing.md#distinguishing-cases Its sibling tests push on the other sides of the in-place and stepping bounds, so a controller that steps needlessly, never steps, does not land or claims recovery while falling fails one of them.
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
