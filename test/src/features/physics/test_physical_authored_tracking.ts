import RAPIER, { type World } from "@dimforge/rapier3d-compat";
import assert from "node:assert/strict";

import { AutoMoviePhysicalPlayback as Playback } from "../../../../packages/engine/src/physics/AutoMoviePhysicalPlayback";
import { AutoMoviePhysicalSimulation as Simulation } from "../../../../packages/engine/src/physics/AutoMoviePhysicalSimulation";
import { assertPhysicalReturnPath } from "../../../../packages/engine/src/physics/assertPhysicalReturnPath";
import { bindPhysicalWorld } from "../../../../packages/engine/src/physics/bindPhysicalWorld";
import { PhysicalFixtures } from "../internal/PhysicalFixtures";
import { PhysicalPointFixtures } from "../internal/PhysicalPointFixtures";

/** Positive-strength authored ownership and physical withdrawal remain distinct.
 *
 * Scenarios:
 * 1. Strength zero/one and both quality policies distinguish actual dynamic withdrawal from authored/return ownership, including initial native checkpoint zero.
 * 2. Checkpoint continuation and binary replay preserve causal ownership.
 * 3. An explicit all-dynamic selection and omission produce the identical independently authored root-force response despite self-contact fitting.
 */
export async function test_physical_authored_tracking(): Promise<void> {
  await strictReturnBoundary();
  for (const strength of [0, 1])
    for (const duringReflex of [false, true]) {
      const input: Simulation.IInput = trackingInput(strength, duringReflex);
      const body: Simulation.IBody = input.bodies[0]!;
      const run: Simulation = await Simulation.compute(input);
      for (const [step, snapshot] of run.cache.checkpoints) {
        const withdrawn: boolean = strength === 0 && step >= 13 && step <= 24;
        const controller: ReturnType<
          typeof run.cache.controllerCheckpoints.get
        > = run.cache.controllerCheckpoints.get(step);
        if (step > 0) assert.ok(controller);
        assert.deepEqual(
          controller?.released ?? [],
          withdrawn ? [body.id] : [],
        );
        assert.deepEqual(controller?.contactReleased ?? [], []);
        const world: World = RAPIER.World.restoreSnapshot(snapshot);
        try {
          const bound: ReturnType<typeof bindPhysicalWorld> = bindPhysicalWorld(
            world,
            run.input,
            true,
          );
          for (const [bone, rigid] of bound.segments.get(body.id)!) {
            assert.equal(
              rigid.additionalSolverIterations(),
              withdrawn ? 32 : 0,
            );
            assert.equal(rigid.additionalPgsIterations(), withdrawn ? 60 : 0);
            assert.equal(
              rigid.isDynamic(),
              bone !== "root" && step >= 13 && step <= 24,
            );
          }
        } finally {
          world.free();
        }
      }
      assert.equal(run.cache.ownershipAt(body.id, "source", 0.15), "dynamic");
      assert.equal(run.cache.ownershipAt(body.id, "source", 0.25), "return");
      assert.equal(run.cache.ownershipAt(body.id, "source", 0.4), "authored");
      const bytes: Uint8Array = await Playback.encode(run.cache, 1_000_000);
      const replay: Playback = await Playback.decode(
        bytes,
        run.cache.identity,
        { maximumBytes: 1_000_000, maximumFrames: 49, maximumSegments: 4 },
      );
      assert.deepEqual(replay.ownership, run.cache.ownership);
      const edited: Simulation.IInput = structuredClone(input);
      for (
        let step: number = 40;
        step < edited.bodies[0]!.targets.length;
        step++
      )
        edited.bodies[0]!.targets[step]!.segments.root!.position.x = 0.001;
      const cold: Simulation = await Simulation.compute(edited);
      const resumed: Simulation = await Simulation.compute(edited, run);
      assert.ok(resumed.recomputedSteps < 48);
      assert.equal(
        JSON.stringify(resumed.cache.frames),
        JSON.stringify(cold.cache.frames),
      );
      assert.equal(
        JSON.stringify(resumed.cache.ownership),
        JSON.stringify(cold.cache.ownership),
      );
    }

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

/** Keep strict-default refusal separate from lifecycle qualification under an explicitly admitted native residual envelope. */
function trackingInput(
  strength: number,
  duringReflex: boolean,
): Simulation.IInput {
  const body: Simulation.IBody = PhysicalFixtures.body(
    "assembly",
    PhysicalPointFixtures.profile(),
    0.4,
  );
  body.handoffSeconds = 0.1;
  // The lifecycle cases use the same declared inherited-error limits as the
  // qualified ownership_handoff fixture. The independent strict guard retains defaults.
  body.handoffLimits = {
    maximumLinearError: 0.001,
    maximumJointViolation: 0.0001,
  };
  body.releasedQuality = {
    iterations: 64,
    internalIterations: 64,
    duringReflex,
  };
  for (const [step, target] of body.targets.entries()) {
    target.strength = strength;
    target.dynamicSegments =
      step >= 13 && step <= 24 ? ["carrier", "source", "reference"] : [];
  }
  const input: Simulation.IInput = PhysicalFixtures.input([body], 0.4);
  Object.assign(input, {
    substeps: 8,
    iterations: 32,
    internalIterations: 4,
    checkpointEvery: 1,
  });
  return input;
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
