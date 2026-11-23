import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../internal/PhysicalDisturbance";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/**
 * A disturbance recovery resumed from a checkpoint is the unbroken run: the
 * four-support primitive pushed in the middle of its one-step window, run
 * unbroken to 1 s, in two chunks the second resuming at 0.5 s mid-recovery, and
 * unbroken again, gives bit-equal frames (`PhysicalDisturbance.resume`).
 *
 * Scenarios:
 *
 * 1. The run resumed at 0.5 s matches the unbroken run at every step.
 * 2. Two unbroken runs match.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the push, the chunking and the bit-equality required.
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` unbroken and resumed from its own checkpoint and hashes every segment transform of every frame.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the unbroken run itself: a resumed simulation must reproduce it exactly.
 * @evidence contracts/development/testing.md#distinguishing-cases The resume falls after the push while the controller's stance solve and recovery state carry history, so state kept outside the checkpoint parts the runs.
 * @evidence contracts/development/testing.md#execution-ownership Builds the fixture in memory and runs four short native simulations with no viewer or file host.
 */
export async function test_physical_disturbance_resume(): Promise<void> {
  const subject: PhysicalDisturbance.ISubject = PhysicalDisturbance.planted(
    PhysicalModelFixtures.quadrupod(),
  );
  TestValidator.equals(
    "resumed disturbance",
    await PhysicalDisturbance.resume(
      subject,
      "z",
      PhysicalDisturbance.impulse(subject, "recover", "z"),
      [0.5, 1],
    ),
    [],
  );
}
