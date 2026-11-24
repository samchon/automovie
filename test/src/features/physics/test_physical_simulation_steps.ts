import { planPhysicalSimulationSteps } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A dynamic run performs the steps after the one it resumes from and snapshots
 * after each multiple of the declared cadence among them
 * (`planPhysicalSimulationSteps`).
 *
 * Scenarios, as start, film steps and cadence:
 *
 * 1. A fresh 30-step run every 10 performs 30 steps and snapshots after 10, 20 and
 *    30; with the snapshot of step 0 a fresh run takes first, that is 0, 10, 20
 *    and 30.
 * 2. A 25-step film every 10 snapshots after 10 and 20, not after its last step; a
 *    10-step film every 10 after 10; a 5-step film every 10 never.
 * 3. A run resumed at 20 every 10 performs 10 steps and snapshots after 30 only,
 *    not again after 20.
 * 4. A run resumed at 24 every step performs 6 steps and snapshots after each.
 * 5. A run resumed at the film's end performs no step and snapshots nothing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists each case's start, film length and cadence with the steps and snapshots it must give.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `planPhysicalSimulationSteps` and compares its performed-step count and snapshot steps with the expected ones.
 * @evidence contracts/development/testing.md#independent-expectations Each expectation is the definition written out by hand: the steps after the start through the film's end, counted, and the multiples of the cadence among them.
 * @evidence contracts/development/testing.md#distinguishing-cases The film ends on, between and before a multiple of the cadence, the run starts fresh, on a snapshot and at the end, and the cadence is one step; a plan that included the start, dropped the last step or stepped from the start instead of from the cadence fails one. Choosing the start is `test_physical_checkpoint_resume`'s; the snapshot's content is `test_physical_snapshot_resume`'s.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation over integers; no world, viewer or simulation runs.
 */
export function test_physical_simulation_steps(): void {
  const plan: typeof planPhysicalSimulationSteps = planPhysicalSimulationSteps;
  TestValidator.equals(
    "the run's steps and snapshots",
    {
      fresh: plan(0, 30, 10),
      between: plan(0, 25, 10),
      on: plan(0, 10, 10),
      before: plan(0, 5, 10),
      resumed: plan(20, 30, 10),
      every: plan(24, 30, 1),
      end: plan(30, 30, 10),
    },
    {
      fresh: { steps: 30, snapshots: [10, 20, 30] },
      between: { steps: 25, snapshots: [10, 20] },
      on: { steps: 10, snapshots: [10] },
      before: { steps: 5, snapshots: [] },
      resumed: { steps: 10, snapshots: [30] },
      every: { steps: 6, snapshots: [25, 26, 27, 28, 29, 30] },
      end: { steps: 0, snapshots: [] },
    },
  );
}
