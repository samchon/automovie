import {
  AutoMoviePhysicalSimulation as Simulation,
  assertPhysicalReturnPath,
  bindPhysicalWorld,
} from "@automovie/engine";
import RAPIER, { type World } from "@dimforge/rapier3d-compat";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalPointFixtures } from "../internal/PhysicalPointFixtures";

/** Explicit dynamic selection and its omission are one ownership, and a return outside the joint envelope is refused.
 *
 * Scenarios:
 * 1. A known actual native rotation outside a fixed joint's envelope is refused by the strict return guard.
 * 2. An explicit all-dynamic selection and omission produce the identical independently authored root-force response despite self-contact fitting, and the response actually moves the body.
 *
 * Withdrawal and released budgets belong to `test_physical_balance_withdrawal` and `test_physical_balance_release_quality`; ownership transitions, checkpoints and replay to `test_physical_ownership_handoff` and `test_physical_released_quality`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalSimulation`, `assertPhysicalReturnPath`, `bindPhysicalWorld` on in-memory inputs and asserts the returned observations through 1x assertPhysicalReturnPath(; 2 numbered scenarios (first: A known actual native rotation outside a fixed joint's envelope is refused by the strict return guard.; last: An explicit all-dynamic selection and omission produce the identical independently authored root-force...). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 2 numbered scenarios (first: A known actual native rotation outside a fixed joint's envelope is refused by the strict return guard.; last: An explicit all-dynamic selection and omission produce the identical independently authored root-force...), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_authored_tracking`, which owns the cases delegated to `PhysicalFixtures`, `PhysicalPointFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A known actual native rotation outside a fixed joint's envelope is refused by the strict return guard.).
 */
export async function test_physical_authored_tracking(): Promise<void> {
  await strictReturnBoundary();

  // A one-segment body isolates root force intent from all joint fitting.
  const sphere: Simulation.IBody = PhysicalFixtures.body(
    "root-intent",
    PhysicalFixtures.sphere(),
    0.2,
  );
  sphere.rootStiffness = 100;
  sphere.rootDamping = 15;
  sphere.maximumRootForce = 25;
  sphere.selfAvoidance = { iterations: 8, tolerance: 1e-6 };
  for (const [step, target] of sphere.targets.entries()) {
    target.strength = 1;
    if (step >= 4) target.segments.root!.position.x = 0.2;
  }
  const rootInput: Simulation.IInput = PhysicalFixtures.input([sphere], 0.2);
  rootInput.substeps = 8;
  const omitted: Simulation = await Simulation.compute(rootInput);
  const explicit: Simulation.IInput = structuredClone(rootInput);
  for (const target of explicit.bodies[0]!.targets)
    target.dynamicSegments = ["root"];
  const selected: Simulation = await Simulation.compute(explicit);
  assert.ok(omitted.cache.at(0.2).bodies[sphere.id]!.root!.position.x > 0.05);
  assert.equal(
    JSON.stringify(selected.cache.frames),
    JSON.stringify(omitted.cache.frames),
  );
}

/** A known actual native rotation outside a fixed joint's envelope is refused independently of integration noise. */
async function strictReturnBoundary(): Promise<void> {
  const body: Simulation.IBody = PhysicalFixtures.body(
    "assembly",
    PhysicalPointFixtures.profile(),
    1 / 120,
  );
  for (const target of body.targets) target.dynamicSegments = [];
  const input: Simulation.IInput = PhysicalFixtures.input([body], 1 / 120);
  input.substeps = 8;
  const defaults: Simulation = await Simulation.compute(input);
  const world: World = new RAPIER.World(input.gravity);
  try {
    const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
      world,
      defaults.input,
      false,
    );
    bound.segments
      .get(body.id)!
      .get("source")!
      .setRotation(
        { x: 0, y: 0, z: Math.sin(0.001 / 2), w: Math.cos(0.001 / 2) },
        true,
      );
    bound.handoffs.set(body.id, {
      source: {
        tick: 0,
        duration: defaults.input.bodies[0]!.handoffSeconds!,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        angularVelocity: { x: 0, y: 0, z: 0 },
      },
    });
    assert.throws(
      (): void => assertPhysicalReturnPath(defaults.input, bound, 1, "after"),
      /Physical return violates joint limit envelope/,
    );
  } finally {
    world.free();
  }
}
