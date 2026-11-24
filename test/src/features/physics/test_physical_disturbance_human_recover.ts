import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../internal/PhysicalDisturbance";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The canonical Human, standing in its public Stand under internal actuation
 * only, meets a 0.1 s forward push in the middle of its one-step window and is
 * captured again in place or after one landed step. Its capture point stays
 * inside the support for 1 / omega, with every step resolved, the root
 * upright, the soles flat, the height kept and only the feet on the floor. The
 * run's record is audited (`PhysicalDisturbance.audit`):
 *
 * - the body's momentum matches the floor's load;
 * - the contacts' provenance is real;
 * - the support wrenches stay within their bound;
 * - the landed step left the floor and touched it again.
 *
 * Scenarios:
 *
 * 1. Forward, z: captured by one step at most, decided at the end of the capture
 *    dwell.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the push, the verdict and the audit the run must pass.
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` from a 0.1 s quiet prefix in checkpoint-aligned chunks until the verdict is decided, and reads the recovery record, frames, floor receipts and support wrenches.
 * @evidence contracts/development/testing.md#independent-expectations The push lies between the in-place bound (Hof et al. 2005) and the one-step bound (Koolen et al., Eq. 25) from the body's own pendulum; the dwell 1 / omega is the time in which a diverging capture point grows e times; the momentum audit is Newton's second law within #3092's 2 percent.
 * @evidence contracts/development/testing.md#distinguishing-cases A controller that never steps falls and one whose step never lands is never captured, both failing here; a second landed swing phase fails; the in-place and beyond-recovery siblings are `test_physical_disturbance_human_sustained` and `test_physical_disturbance_human_fall`.
 * @evidence contracts/development/testing.md#execution-ownership Builds the performance in memory and runs one short native simulation with no viewer or file host.
 */
export async function test_physical_disturbance_human_recover(): Promise<void> {
  const failures: string[] = [];
  await PhysicalDisturbance.verify(
    PhysicalDisturbance.standing(motionHumanBody("m-average")),
    "recover",
    "z",
    failures,
  );
  TestValidator.equals("Human recover disturbance", failures, []);
}
