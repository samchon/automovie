import { AutoMovieEnginePhysicsCache, AutoMovieEnginePhysicalSimulation } from "@automovie/engine";
import type {
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../../internal/PhysicalFixtures";

/** Cache intervals of the previous run's film. */
const COUNT: number = 30;

/** Two tracked spheres over `count` intervals at 120 Hz, one work budget. */
function workload(count: number): IAutoMoviePhysicalSimulationInput.IInput {
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input(
      ["a", "b"].map(
        (id: string): IAutoMoviePhysicalSimulationInput.IBody =>
          PhysicalFixtures.body(id, PhysicalFixtures.sphere(), count / 120),
      ),
      count / 120,
    );
  for (const body of input.bodies)
    for (const target of body.targets) target.strength = 1;
  input.substeps = 16;
  input.maximumSteps = 2 * COUNT;
  return input;
}

/** Halve the last body's tracking strength from one interval on. */
function edit(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  step: number,
): IAutoMoviePhysicalSimulationInput.IInput {
  const last: number = input.bodies.length - 1;
  return {
    ...input,
    bodies: input.bodies.map(
      (
        body: IAutoMoviePhysicalSimulationInput.IBody,
        index: number,
      ): IAutoMoviePhysicalSimulationInput.IBody =>
        index !== last
          ? body
          : {
              ...body,
              targets: body.targets.map(
                (
                  target: IAutoMoviePhysicalSimulationInput.ITarget,
                  at: number,
                ): IAutoMoviePhysicalSimulationInput.ITarget =>
                  at < step
                    ? target
                    : { ...target, strength: target.strength / 2 },
              ),
            },
    ),
  };
}

/**
 * A previous run's record written by hand: its input and an empty snapshot
 * every `every` intervals, of which only the steps are read; no world is
 * built.
 */
function previous(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  every: number,
  protocol?: string,
): IAutoMoviePhysicalSimulation {
  const cache: AutoMovieEnginePhysicsCache = new AutoMovieEnginePhysicsCache(
    "previous",
    input.rate,
    input.duration,
  );
  for (let step: number = 0; step <= COUNT; step += every)
    cache.checkpoints.set(step, new Uint8Array());
  if (protocol !== undefined) Reflect.set(cache, "protocol", protocol);
  return {
    input,
    cache,
    recomputedSteps: COUNT,
    tracking: [],
    trackingAt: (): IAutoMoviePhysicalSimulationInput.IDiagnostic[] => [],
  };
}

/**
 * `checkpointPhysicalSimulation` chooses where an edited run resumes: the last
 * snapshot strictly before the first interval whose sampled input changed, and
 * interval 0 for anything that changes the whole run.
 *
 * Scenarios, two bodies over 30 intervals at 120 Hz, the edit halving the last
 * body's tracking strength from one interval on:
 *
 * 1. With no previous run, a stale cache protocol or a changed substep count it
 *    starts at 0.
 * 2. With snapshots every 10 intervals an edit at 25 resumes from 20, one at 20
 *    from 10, the snapshot at 20 already holding it, and one at 0 from 0.
 * 3. With a snapshot at every interval an edit at 25 resumes from 24, and so does
 *    a push stated at 25.
 * 4. A film twice as long over the same first 30 intervals resumes from 30.
 */
export function test_engine_physics_checkpoint_physical_simulation(): void {
  const original: IAutoMoviePhysicalSimulationInput.IInput = workload(COUNT);
  const tens: IAutoMoviePhysicalSimulation = previous(original, 10);
  const every: IAutoMoviePhysicalSimulation = previous(original, 1);
  const stale: IAutoMoviePhysicalSimulation = previous(
    original,
    10,
    "automovie.physical-cache.v0",
  );
  const pushed: IAutoMoviePhysicalSimulationInput.IInput = {
    ...original,
    impulses: [
      {
        step: 25,
        body: "b",
        bone: "root",
        point: { x: 0, y: 1, z: 0 },
        impulse: { x: 1, y: 0, z: 0 },
      },
    ],
  };
  TestValidator.equals(
    "the resume interval",
    [
      AutoMovieEnginePhysicalSimulation.checkpoint(edit(original, 25)),
      AutoMovieEnginePhysicalSimulation.checkpoint(edit(original, 25), stale),
      AutoMovieEnginePhysicalSimulation.checkpoint(
        { ...edit(original, 25), substeps: 8 },
        tens,
      ),
      AutoMovieEnginePhysicalSimulation.checkpoint(edit(original, 25), tens),
      AutoMovieEnginePhysicalSimulation.checkpoint(edit(original, 20), tens),
      AutoMovieEnginePhysicalSimulation.checkpoint(edit(original, 0), tens),
      AutoMovieEnginePhysicalSimulation.checkpoint(edit(original, 25), every),
      AutoMovieEnginePhysicalSimulation.checkpoint(pushed, every),
      AutoMovieEnginePhysicalSimulation.checkpoint(workload(2 * COUNT), tens),
    ],
    [0, 0, 0, 20, 10, 0, 24, 24, COUNT],
  );
}
