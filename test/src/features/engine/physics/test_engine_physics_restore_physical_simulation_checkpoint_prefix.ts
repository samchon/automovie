import {
  AutoMoviePhysicsCache,
  AutoMovieXpbdWorld,
  restorePhysicalSimulationCheckpoint,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalControllerCheckpoint,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../../internal/PhysicalFixtures";

/**
 * Checkpoint-prefix copying has no call-argument ceiling and finishes before
 * the solver world is rebuilt.
 *
 * Scenarios:
 *
 * 1. A 200001-frame prefix restores its complete ordered frame references and an
 *    independent solver world.
 * 2. A failing controller clone is reported before a deliberately unusable
 *    snapshot can be restored.
 */
export async function test_engine_physics_restore_physical_simulation_checkpoint_prefix(): Promise<void> {
  const start: number = 200000;
  const input: IAutoMoviePhysicalSimulationInput.IInput =
    PhysicalFixtures.input([], start + 1);
  input.rate = 1;
  const original: AutoMoviePhysicsCache = new AutoMoviePhysicsCache(
    "prefix",
    1,
    start + 1,
  );
  for (let index: number = 0; index <= start; index++)
    original.frames.push({ seconds: index, bodies: {} });
  const control: IAutoMoviePhysicalControllerCheckpoint = {
    contactCount: 0,
    episodes: [],
    active: [],
    softened: [],
    ownershipCount: 0,
  };
  original.controllerCheckpoints.set(start, control);
  // One marked body tells the checkpoint's world from a fresh empty one.
  const native: AutoMovieXpbdWorld = new AutoMovieXpbdWorld(input.gravity);
  native.createBody(false, {
    position: { x: 7, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  });
  original.checkpoints.set(start, native.takeSnapshot());
  const previous: IAutoMoviePhysicalSimulation = {
    input,
    cache: original,
    recomputedSteps: start,
    tracking: [],
    trackingAt: (): IAutoMoviePhysicalSimulationInput.IDiagnostic[] => [],
  };
  const copied: AutoMoviePhysicsCache = new AutoMoviePhysicsCache(
    "prefix",
    1,
    start + 1,
  );
  const restored: AutoMovieXpbdWorld = restorePhysicalSimulationCheckpoint(
    input,
    previous,
    copied,
    start,
    [],
  );
  const first: IAutoMoviePhysicalFrame | undefined = copied.frames[0];
  TestValidator.predicate(
    "the complete borrowed prefix survives restoration",
    copied.frames.length === start + 1 &&
      first === original.frames[0] &&
      copied.frames[start] === original.frames[start],
  );
  TestValidator.predicate(
    "the restored world is the checkpoint's world",
    restored.bodies.length === 1 &&
      restored.bodies[0]!.translation().x === 7 &&
      restored !== native,
  );
  const failure: Error = new Error("caller checkpoint clone failed");
  original.controllerCheckpoints.set(start, {
    contactCount: 0,
    active: [],
    softened: [],
    /**
     * Deliberate caller-state copy failure, before any snapshot should be
     * restored.
     */
    get episodes(): IAutoMoviePhysicalControllerCheckpoint["episodes"] {
      throw failure;
    },
  });
  original.checkpoints.set(start, new Uint8Array());
  assert.throws(
    (): void => {
      restorePhysicalSimulationCheckpoint(
        input,
        previous,
        new AutoMoviePhysicsCache("prefix", 1, start + 1),
        start,
        [],
      );
    },
    (error: unknown): boolean => error === failure,
  );
}
