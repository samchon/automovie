import {
  AutoMoviePhysicsCache,
  restorePhysicalSimulationCheckpoint,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalControllerCheckpoint,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalSimulation,
  IAutoMoviePhysicalSimulationInput,
} from "@automovie/interface";
import RAPIER, { type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/**
 * Checkpoint-prefix copying has no call-argument ceiling and finishes before native ownership begins.
 *
 * Scenarios:
 * 1. A 200001-frame prefix restores its complete ordered frame references and an independent native world.
 * 2. A failing controller clone is reported before a deliberately unusable snapshot can be restored.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual prefix restoration using an in-memory Rapier snapshot, then checks prefix length/endpoints and disposes both native worlds. A throwing checkpoint getter pins copy-before-allocation ordering without mocking native methods.
 * @evidence contracts/development/testing.md#independent-expectations The supplied prefix has exactly start+1 indexed seconds and preserves borrowed frame identity; the unique thrown sentinel belongs to the caller's checkpoint. The failure case establishes ordering, not a native heap measurement.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a prefix above common JavaScript argument limits, empty causal ledgers, successful native ownership transfer and a pre-allocation copy failure. Existing simulation tests own native/controller trajectory equivalence.
 * @evidence contracts/development/testing.md#execution-ownership Portable unit uses installed Rapier on explicit in-memory data, starts no host or native build, and frees every world it receives.
 * @evidence contracts/development/common.md#meaningful-documentation States prefix size, ownership and the failure sentinel's proof limit.
 */
export async function test_physical_checkpoint_prefix(): Promise<void> {
  await RAPIER.init();
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
  const native: World = new RAPIER.World(input.gravity);
  try {
    original.checkpoints.set(start, native.takeSnapshot());
  } finally {
    native.free();
  }
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
  const restored: World = restorePhysicalSimulationCheckpoint(
    input,
    previous,
    copied,
    start,
    [],
  );
  try {
    const first: IAutoMoviePhysicalFrame | undefined = copied.frames[0];
    TestValidator.predicate(
      "the complete borrowed prefix survives restoration",
      copied.frames.length === start + 1 &&
        first === original.frames[0] &&
        copied.frames[start] === original.frames[start],
    );
  } finally {
    restored.free();
  }
  const failure: Error = new Error("caller checkpoint clone failed");
  original.controllerCheckpoints.set(start, {
    contactCount: 0,
    active: [],
    softened: [],
    /** Deliberate caller-state copy failure, before any snapshot should be restored. */
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
