import { TestValidator } from "@nestia/e2e";

import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
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
