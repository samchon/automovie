import {
  advancePhysicalBalance as Balance,
  AutoMoviePhysicalSimulation as Simulation,
  Vector3,
  bindPhysicalWorld,
  trackPhysicalWorld,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import RAPIER, { type RigidBody, type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalModelFixtures } from "../internal/PhysicalModelFixtures";
import { PhysicalSupportFixtures } from "../internal/PhysicalSupportFixtures";

/** Exhausted recovery clears every new force, while real reacquired support restores effort.
 *
 * Scenarios:
 * 1. A retained endpoint offset cannot leak fresh world force after repeated withdrawal.
 * 2. Actual native floor contacts clear a previous failed-landing latch without a special bracing policy.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `Vector3`, `AutoMoviePhysicalSimulation`, `advancePhysicalBalance` on in-memory inputs and asserts the returned observations through 2x TestValidator.predicate; 2 numbered scenarios (first: A retained endpoint offset cannot leak fresh world force after repeated withdrawal.; last: Actual native floor contacts clear a previous failed-landing latch without a special bracing policy.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (2 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 2 numbered scenarios (first: A retained endpoint offset cannot leak fresh world force after repeated withdrawal.; last: Actual native floor contacts clear a previous failed-landing latch without a special bracing policy.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_recovery_release`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalModelFixtures`, `PhysicalSupportFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A retained endpoint offset cannot leak fresh world force after repeated withdrawal.).
 */
export async function test_physical_recovery_release(): Promise<void> {
  await RAPIER.init();
  const profile: P = PhysicalModelFixtures.quadrupod();
  const body: Simulation.IBody = PhysicalSupportFixtures.body(profile, 1);
  const input: Simulation.IInput = PhysicalFixtures.input([body], 1);
  Object.assign(input, {
    gravity: { x: 0, y: -9.81, z: 0 },
    substeps: 4,
    internalIterations: 1,
    contactTolerance: 0.0001,
    contactFrequency: 240,
  });
  const world: World = new RAPIER.World(input.gravity);
  try {
    world.timestep = 1 / 480;
    world.integrationParameters.normalizedPredictionDistance = 0;
    world.integrationParameters.normalizedAllowedLinearError =
      input.contactTolerance!;
    world.integrationParameters.contact_natural_frequency =
      input.contactFrequency!;
    const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
      world,
      input,
      false,
    );
    const state: Balance.IState = {
      last: "unrecoverable",
      failedLanding: true,
      lostSince: 0,
      steps: [],
      offsets: { "support-0": { x: 0.1, y: 0, z: 0 } },
    };
    for (const seconds of [0.9, 0.91]) {
      trackPhysicalWorld(
        world,
        input,
        bound,
        120,
        new Map(),
        [],
        { [body.id]: state },
        [],
        seconds,
      );
      TestValidator.predicate(
        "every released substep clears new recovery force",
        [...bound.segments.get(body.id)!.values()].every(
          (rigid: RigidBody): boolean =>
            Vector3.length(rigid.userForce()) === 0 &&
            Vector3.length(rigid.userTorque()) === 0,
        ),
      );
    }
  } finally {
    world.free();
  }
  const floorInput: Simulation.IInput = structuredClone(input);
  floorInput.floor = 0;
  const landed: World = new RAPIER.World(floorInput.gravity);
  try {
    landed.timestep = 1 / 480;
    landed.integrationParameters.normalizedPredictionDistance = 0;
    landed.integrationParameters.normalizedAllowedLinearError =
      floorInput.contactTolerance!;
    landed.integrationParameters.contact_natural_frequency =
      floorInput.contactFrequency!;
    const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
      landed,
      floorInput,
      false,
    );
    for (let step: number = 0; step < 4; step++) landed.step();
    const state: Balance.IState = {
      last: "unrecoverable",
      failedLanding: true,
      lostSince: 0,
      steps: [],
      offsets: {},
    };
    const result: ReturnType<typeof Balance> = Balance({
      world: landed,
      body: body.id,
      profile,
      segments: bound.segments.get(body.id)!,
      colliders: bound.colliders,
      contacts: [],
      policy: body.balance!,
      state,
      targets: body.targets[0]!.segments,
      seconds: 4 / 480,
      dt: 1 / 480,
      gravity: 9.81,
      floor: 0,
    });
    TestValidator.predicate(
      "real support restores bounded effort after an earlier failure",
      result.state.last === "supported" &&
        result.state.failedLanding === undefined &&
        result.rootStrength === 1,
    );
  } finally {
    landed.free();
  }
}
