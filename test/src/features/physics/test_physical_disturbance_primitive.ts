import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../internal/PhysicalDisturbance";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/**
 * The independent four-support primitive, under the same internal actuation as
 * the Human, keeps its stance against a 0.1 s push half its in-place bound,
 * forward and sideways, recovers in place or by one step from a forward one in
 * the middle of its one-step window, and is never captured from one one and a
 * half times its any-step bound, every push stated from its own inverted
 * pendulum (`PhysicalDisturbance`).
 *
 * Scenarios:
 *
 * 1. Sustained, forward and sideways: no step, still supported and not tipped,
 *    every support flat throughout, the height kept and the floor load back at
 *    the weight.
 * 2. Recover: in place or after one recovery step the body is captured again, its
 *    settled root not tipped, on flat supports alone at its height.
 * 3. Fall: past the any-step bound the body is never captured after the push,
 *    whether it falls or keeps stepping, and no support wrench exceeded the
 *    force bound.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three pushes and what each outcome must show.
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` on the maintained four-support fixture and reads the recovery record, cache frames, contact receipts and support wrenches.
 * @evidence contracts/development/testing.md#independent-expectations The pushes come from the inverted pendulum (Hof, Gazendam and Sinke 2005) with the fixture's own mass, height and support outlines and the declared step reach and timing.
 * @evidence contracts/development/testing.md#distinguishing-cases Pushes on either side of the in-place and stepping bounds tell a controller that steps needlessly, never steps, does not land or claims recovery while falling.
 * @evidence contracts/development/testing.md#execution-ownership Builds the fixture in memory and runs four short native simulations with no viewer or file host.
 */
export async function test_physical_disturbance_primitive(): Promise<void> {
  const failures: string[] = [];
  const subject: PhysicalDisturbance.ISubject = PhysicalDisturbance.planted(
    PhysicalModelFixtures.quadrupod(),
  );
  for (const [name, axis] of [
    ["sustained", "z"],
    ["sustained", "x"],
    ["recover", "z"],
    ["fall", "z"],
  ] as const)
    await PhysicalDisturbance.verify(subject, name, axis, failures);
  TestValidator.equals("four-support disturbance", failures, []);
}
