import { TestValidator } from "@nestia/e2e";

import { PhysicalDisturbance } from "../internal/PhysicalDisturbance";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";

/**
 * A disturbance recovery resumed from its checkpoints is the unbroken run. The
 * four-support primitive is pushed in the middle of its one-step window and
 * run for one second twice:
 *
 * - in checkpoint-aligned 0.05 s chunks, each resuming the last, so resume
 *   points fall through the quiet stance, the push, the trigger, the swing and
 *   the landing;
 * - unbroken.
 *
 * The two give bit-equal frames (`PhysicalDisturbance.resume`).
 *
 * Scenarios:
 *
 * 1. The run resumed every six steps matches the unbroken run at every step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the push, the chunking and the bit-equality required.
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation.compute` resumed from its own checkpoints and unbroken, and hashes every segment transform of every frame.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the unbroken run itself: a resumed simulation must reproduce it exactly.
 * @evidence contracts/development/testing.md#distinguishing-cases Resume points fall in every phase of the recovery while the stance solve and recovery state carry history, so state kept outside the checkpoint at any of them parts the runs; a second unbroken run is not needed, since a nondeterministic run parts from the resumed one too.
 * @evidence contracts/development/testing.md#execution-ownership Builds the fixture in memory and runs two one-second native simulations, one of them in chunks, with no viewer or file host.
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
      1,
    ),
    [],
  );
}
