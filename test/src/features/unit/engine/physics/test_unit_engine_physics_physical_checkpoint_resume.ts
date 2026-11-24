import {
  AutoMoviePhysicsCache,
  checkpointPhysicalSimulation,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../../../internal/PhysicalFixtures";

/** Cache intervals of the previous run's film. */
const COUNT: number = 30;

/**
 * A late edit resumes from the last snapshot strictly before the first interval
 * whose sampled input changed, and anything that can change the whole run
 * restarts it (`checkpointPhysicalSimulation`).
 *
 * A hand-written record of a previous run of two bodies over 30 intervals at
 * 120 Hz, no world built; the edit halves the last body's tracking strength
 * from one interval on.
 *
 * Scenarios:
 *
 * 1. With no previous run, a stale cache protocol or a changed setting, the run
 *    starts at interval 0.
 * 2. With snapshots every 10 intervals, an edit at 25 resumes from 20, and an edit
 *    at 20 from 10: the snapshot at the edited interval already holds it. An
 *    edit at 0 has no snapshot before it.
 * 3. With a snapshot at every interval, an edit at 25 resumes from 24, so the
 *    edited input first departs at 25, neither earlier nor later; a push stated
 *    at 25 departs there too.
 * 4. A longer film over the same 30 intervals resumes from the last snapshot of
 *    the shared prefix, 30.
 */
export function test_unit_engine_physics_physical_checkpoint_resume(): void {
  const original: IAutoMoviePhysicalSimulationInput.IInput = workload(COUNT);
  const tens: IAutoMoviePhysicalSimulation = previous(original, 10);
  const every: IAutoMoviePhysicalSimulation = previous(original, 1);
  const stale: IAutoMoviePhysicalSimulation = previous(original, 10);
  Reflect.set(stale.cache, "protocol", "automovie.physical-cache.v0");
  // Its first 31 targets are the original's, its work budget the same.
  const longer: IAutoMoviePhysicalSimulationInput.IInput = workload(2 * COUNT);
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
    {
      fresh: checkpointPhysicalSimulation(edit(original, 25)),
      stale: checkpointPhysicalSimulation(edit(original, 25), stale),
      settings: checkpointPhysicalSimulation(
        { ...edit(original, 25), substeps: 8 },
        tens,
      ),
      late: checkpointPhysicalSimulation(edit(original, 25), tens),
      snapshot: checkpointPhysicalSimulation(edit(original, 20), tens),
      first: checkpointPhysicalSimulation(edit(original, 0), tens),
      exact: checkpointPhysicalSimulation(edit(original, 25), every),
      push: checkpointPhysicalSimulation(pushed, every),
      longer: checkpointPhysicalSimulation(longer, tens),
    },
    {
      fresh: 0,
      stale: 0,
      settings: 0,
      late: 20,
      snapshot: 10,
      first: 0,
      exact: 24,
      push: 24,
      longer: COUNT,
    },
  );
}

/** Two tracked spheres over `count` intervals with the same work budget. */
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
 * A previous run's record, written by hand: its input and an empty snapshot
 * every `every` intervals, only their steps read; no world is built or
 * stepped.
 */
function previous(
  input: IAutoMoviePhysicalSimulationInput.IInput,
  every: number,
): IAutoMoviePhysicalSimulation {
  const cache: AutoMoviePhysicsCache = new AutoMoviePhysicsCache(
    "previous",
    input.rate,
    input.duration,
  );
  for (let step: number = 0; step <= COUNT; step += every)
    cache.checkpoints.set(step, new Uint8Array());
  return {
    input,
    cache,
    recomputedSteps: COUNT,
    tracking: [],
    trackingAt: (): IAutoMoviePhysicalSimulationInput.IDiagnostic[] => [],
  };
}
