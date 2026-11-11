import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalPerformanceFixtures } from "../internal/PhysicalPerformanceFixtures";

/** Twelve native steps reach two retained checkpoints before the edit. */
const DURATION: number = 0.1;

/** Steps between retained native checkpoints. */
const CHECKPOINT: number = 4;

/** First edited step, after the second checkpoint. */
const EDIT: number = 10;

/** A support-feedback plan rebuilt from a restored world retains the exact fresh native result.
 *
 * Scenarios:
 * 1. A twelve-step support-feedback walk is computed once, checkpointed every four steps.
 * 2. A later impulse resumes from the last checkpoint before it, recomputes only the remaining steps and matches a fresh computation's frames and contacts exactly.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation` on in-memory inputs and asserts the returned observations through 1x TestValidator.equals; 2 numbered scenarios (first: A twelve-step support-feedback walk is computed once, checkpointed every four steps.; last: A later impulse resumes from the last checkpoint before it, recomputes only the remaining steps and matches...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 2 numbered scenarios (first: A twelve-step support-feedback walk is computed once, checkpointed every four steps.; last: A later impulse resumes from the last checkpoint before it, recomputes only the remaining steps and matches...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_support_checkpoint`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalModelFixtures`, `PhysicalPerformanceFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A twelve-step support-feedback walk is computed once, checkpointed every four steps.).
 */
export async function test_physical_support_checkpoint(): Promise<void> {
  const produced: ReturnType<typeof PhysicalPerformanceFixtures.walk> =
    PhysicalPerformanceFixtures.walk(
      PhysicalModelFixtures.stickman().profile,
      DURATION,
    );
  const input: Simulation.IInput = PhysicalFixtures.input(
    [produced.body],
    DURATION,
  );
  input.checkpointEvery = CHECKPOINT;
  const baseline: Simulation = await Simulation.compute(input);
  const edited: Simulation.IInput = structuredClone(input);
  edited.impulses.push({
    step: EDIT,
    body: produced.body.id,
    bone: "hips",
    point: { x: 0, y: 1, z: 0 },
    impulse: { x: 0.2, y: 0, z: 0 },
  });
  const fresh: Simulation = await Simulation.compute(edited);
  const resumed: Simulation = await Simulation.compute(edited, baseline);
  const findings: string[] = [];
  const restart: number = Math.floor(EDIT / CHECKPOINT) * CHECKPOINT;
  if (resumed.recomputedSteps !== input.maximumSteps - restart)
    findings.push(`recomputed ${resumed.recomputedSteps} steps`);
  if (
    JSON.stringify(fresh.cache.frames) !== JSON.stringify(resumed.cache.frames)
  )
    findings.push("fresh/resumed support states differ");
  if (
    JSON.stringify(fresh.cache.contacts) !==
    JSON.stringify(resumed.cache.contacts)
  )
    findings.push("fresh/resumed contacts differ");
  TestValidator.equals(
    "exact resumed support-feedback performance",
    findings,
    [],
  );
}
