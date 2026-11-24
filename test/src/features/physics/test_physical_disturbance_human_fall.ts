import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../internal/PhysicalDisturbance";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The canonical Human, standing in its public Stand under internal actuation
 * only, meets a 0.1 s forward push one and a half times its any-step bound
 * and falls honestly:
 *
 * - it is never captured after the push;
 * - the run stops once the body is down or tipped past the hip strategy's
 *   range, or, still up at its cap, diverges from landing to landing;
 * - its momentum matches the floor's recorded load, so nothing outside the
 *   contacts holds it;
 * - every floor contact lies on the bone it names;
 * - no support wrench exceeds the force bound (`PhysicalDisturbance.verify`,
 *   `.audit`).
 *
 * Scenarios:
 *
 * 1. Forward, z: never captured, decided at the fall.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the push, the verdict and the audit the run must pass.
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` from a 0.1 s quiet prefix in checkpoint-aligned chunks until the fall is decided, and reads the recovery record, frames, floor receipts and support wrenches.
 * @evidence contracts/development/testing.md#independent-expectations Past Koolen et al.'s any-step bound (Eq. 26) no step sequence captures the body, so a capture is a false recovery; the momentum audit is Newton's second law within #3092's 2 percent; the wrench bound is the body's declared maximum.
 * @evidence contracts/development/testing.md#distinguishing-cases A controller that claims recovery while falling is captured or held by an unrecorded force and fails here; the recoverable siblings are `test_physical_disturbance_human_sustained` and `test_physical_disturbance_human_recover`.
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
