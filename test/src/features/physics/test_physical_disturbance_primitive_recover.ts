import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../internal/PhysicalDisturbance";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/**
 * The independent four-support primitive, under the same internal actuation as
 * the Human and through the same engine with no anatomy of its own, meets a
 * 0.1 s forward push in the middle of its one-step window. It is captured
 * again in place or after one landed swing phase, a diagonal pair lifting
 * together counting as one. Its capture point stays inside the support for
 * 1 / omega, with every step resolved, the root upright, the supports flat and
 * the height kept. The record is audited:
 *
 * - the momentum matches the floor's load;
 * - the contacts' provenance is real;
 * - the wrenches stay within their bound;
 * - each landed leg left the floor and touched it again
 *   (`PhysicalDisturbance.verify`).
 *
 * Scenarios:
 *
 * 1. Forward, z: captured by one swing phase at most.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the push, the verdict and the audit the run must pass.
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` on the maintained four-support fixture from a 0.1 s quiet prefix in checkpoint-aligned chunks until decided, and reads the recovery record, frames, floor receipts and support wrenches.
 * @evidence contracts/development/testing.md#independent-expectations The push lies between the in-place bound (Hof et al. 2005) and the one-step bound (Koolen et al., Eq. 25) from the fixture's own pendulum; the dwell 1 / omega is the time a diverging capture point needs to grow e times; the momentum audit is Newton's second law within #3092's 2 percent.
 * @evidence contracts/development/testing.md#distinguishing-cases A controller that never steps, never lands or steps twice fails here; the in-place and beyond-recovery siblings are `test_physical_disturbance_primitive_sustained` and `test_physical_disturbance_primitive_fall`.
 * @evidence contracts/development/testing.md#execution-ownership Builds the fixture in memory and runs one short native simulation with no viewer or file host.
 */
export async function test_physical_disturbance_primitive_recover(): Promise<void> {
  const failures: string[] = [];
  await PhysicalDisturbance.verify(
    PhysicalDisturbance.planted(PhysicalModelFixtures.quadrupod()),
    "recover",
    "z",
    failures,
  );
  TestValidator.equals("four-support recover disturbance", failures, []);
}
