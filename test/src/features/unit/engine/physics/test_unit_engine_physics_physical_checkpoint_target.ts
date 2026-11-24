import { AutoMoviePhysicalSimulation as Simulation } from "@automovie/engine";
import type {
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
  IAutoMoviePhysicalProfile,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../../../internal/PhysicalFixtures";
import { nclose } from "../../../internal/nclose";

/**
 * An authored sample edit invalidates the checkpoint at that sample.
 *
 * Scenarios:
 * 1. A driven sphere and a separate dynamic body leave actual native
 *    checkpoints at steps 8 and 12.
 * 2. Editing the target at step 12 resumes at step 8. It preserves the prefix
 *    and reproduces a fresh edited run through both affected intervals.
 */
export async function test_unit_engine_physics_physical_checkpoint_target(): Promise<void> {
  const duration: number = 1 / 8;
  const checkpointEvery: number = 4;
  const edit: number = 12;
  const preceding: number = 8;
  const distance: number = 1 / 8;
  const profile: IAutoMoviePhysicalProfile = PhysicalFixtures.sphere();
  const mover: IAutoMoviePhysicalSimulationInput.IBody = PhysicalFixtures.body(
    "mover",
    profile,
    duration,
  );
  mover.mode = { kind: "kinematic" };
  const distant: IAutoMoviePhysicalSimulationInput.IBody = PhysicalFixtures.body(
    "distant",
    profile,
    duration,
    {
      position: { x: 8, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
  );
  const input: IAutoMoviePhysicalSimulationInput.IInput = PhysicalFixtures.input(
    [mover, distant],
    duration,
  );
  input.checkpointEvery = checkpointEvery;
  const baseline: IAutoMoviePhysicalSimulation = await Simulation.compute(input);
  TestValidator.predicate(
    "mixed native input records both checkpoints",
    baseline.cache.checkpoints.has(preceding) &&
      baseline.cache.checkpoints.has(edit),
  );

  const changed: IAutoMoviePhysicalSimulationInput.IInput = structuredClone(input);
  changed.bodies[0]!.targets[edit]!.segments.root!.position.x = distance;
  const resumed: IAutoMoviePhysicalSimulation = await Simulation.compute(
    changed,
    baseline,
  );
  const fresh: IAutoMoviePhysicalSimulation = await Simulation.compute(changed);
  TestValidator.equals(
    "a checkpoint containing edited input is invalidated",
    resumed.recomputedSteps,
    input.maximumSteps - preceding,
  );
  TestValidator.equals(
    "prefix before the edited interval retains its original state",
    JSON.stringify(resumed.cache.frames.slice(0, edit)),
    JSON.stringify(baseline.cache.frames.slice(0, edit)),
  );
  TestValidator.equals(
    "resumed output matches the complete edited run exactly",
    JSON.stringify(resumed.cache.frames),
    JSON.stringify(fresh.cache.frames),
  );

  for (const [step, expected] of [
    [edit + 0.5, distance / 2],
    [edit, distance],
    [edit - 0.5, distance / 2],
    [edit - 1, 0],
  ] as const) {
    const time: number = step / input.rate;
    const position: number = resumed.cache.at(time).bodies[mover.id]!.root!.position.x;
    TestValidator.predicate(
      `edited position at step ${step}`,
      nclose(position, expected, 1e-7),
    );
  }
}
