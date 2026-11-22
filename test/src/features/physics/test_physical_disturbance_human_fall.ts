import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../internal/PhysicalDisturbance";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The canonical Human, standing in its public Stand under internal actuation
 * only, meets a 0.1 s forward push one and a half times the any-step bound: the controller declares the stance unrecoverable, the body loses its height, a part other than a support limb meets the floor, and no support wrench exceeded the body's force bound. The push is stated from the body's own inverted
 * pendulum (`PhysicalDisturbance`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the push and every condition the outcome must meet.
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` on the public Stand handed over through `fitHumanPhysicalStandingPose` and reads the recovery record, cache frames, contact receipts and support wrenches.
 * @evidence contracts/development/testing.md#independent-expectations The push comes from the inverted pendulum (Hof, Gazendam and Sinke 2005) with the body's own mass, height and sole outlines and the declared step reach and timing, not from the controller's assessment.
 * @evidence contracts/development/testing.md#distinguishing-cases Its sibling tests push on the other sides of the in-place and stepping bounds, so a controller that steps needlessly, never steps, does not land or claims recovery while falling fails one of them.
 * @evidence contracts/development/testing.md#execution-ownership Builds the performance in memory and runs one short native simulation with no viewer or file host.
 */
export async function test_physical_disturbance_human_fall(): Promise<void> {
  const failures: string[] = [];
  await PhysicalDisturbance.verify(
    PhysicalDisturbance.standing(motionHumanBody("m-average")),
    "fall",
    "z",
    failures,
  );
  TestValidator.equals("Human fall disturbance", failures, []);
}
