import {
  advancePhysicalBalance as Balance,
  collectPhysicalSupports,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieFootfallPattern as Pattern,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";
import RAPIER, {
  type Collider,
  type RigidBody,
  type World,
} from "@dimforge/rapier3d-compat";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../internal/PhysicalFixtures";

/** Touching constraints remain available for allocation; only actual positive load confirms a landing.
 *
 * Scenarios:
 * 1. A real upward force exactly offsets gravity, leaving a touching native sphere with zero floor impulse.
 * 2. Removing that force produces a positive native floor impulse and confirms the same reached, slow landing.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `advancePhysicalBalance`, `collectPhysicalSupports` on in-memory inputs and asserts the returned observations through no assertion call; 2 numbered scenarios (first: A real upward force exactly offsets gravity, leaving a touching native sphere with zero floor impulse.; last: Removing that force produces a positive native floor impulse and confirms the same reached, slow landing.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 2 numbered scenarios (first: A real upward force exactly offsets gravity, leaving a touching native sphere with zero floor impulse.; last: Removing that force produces a positive native floor impulse and confirms the same reached, slow landing.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_landing_authority`, which owns the cases delegated to `PhysicalFixtures`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A real upward force exactly offsets gravity, leaving a touching native sphere with zero floor impulse.).
 */
export async function test_physical_landing_authority(): Promise<void> {
  await RAPIER.init();
  const profile: P = PhysicalFixtures.sphere(0.125);
  profile.segments[0]!.neutral.position.y = 0.125;
  profile.centerOfMass.y = 0.125;
  const pattern: Pattern = {
    id: "one-carrier",
    minimumSupports: 0,
    limbs: [
      {
        bone: "root",
        chain: ["root"],
        localPoint: { x: 0, y: -0.125, z: 0 },
        phase: 0,
        duty: 1,
        offset: { forward: 0, left: 0 },
        stride: [],
      },
    ],
  };
  const world: World = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  try {
    world.timestep = 1 / 960;
    // Rapier's strict prediction0 test excludes exact gap0 at zero velocity.
    // This independent World retains that exact touching candidate; the adapter
    // still admits only nonpositive actual distance, never the margin itself.
    world.integrationParameters.normalizedPredictionDistance = 0.001;
    const rigid: RigidBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(0, 0.125, 0)
        .setAdditionalMassProperties(
          1,
          { x: 0, y: 0, z: 0 },
          profile.segments[0]!.inertia,
          profile.segments[0]!.inertiaRotation,
        ),
    );
    const source: Collider = world.createCollider(
      RAPIER.ColliderDesc.ball(0.125).setDensity(0),
      rigid,
    );
    const floor: Collider = world.createCollider(
      RAPIER.ColliderDesc.cuboid(2, 0.5, 2).setTranslation(0, -0.5, 0),
    );
    const colliders: Map<number, Receipt["a"]> = new Map([
      [
        source.handle,
        { body: "assembly", bone: "root", shape: "surface", material: "solid" },
      ],
      [
        floor.handle,
        { body: "floor", bone: "floor", shape: "floor", material: "floor" },
      ],
    ]);
    const state: Balance.IState = {
      last: "recovery",
      steps: [],
      offsets: {},
      swing: {
        bone: "root",
        kind: "swing",
        start: 0,
        end: 1 / 960,
        from: { point: [0, 0], yaw: 0, pitch: 0, clearance: 0 },
        to: { point: [0, 0], yaw: 0, pitch: 0, clearance: 0 },
      },
    };
    state.steps.push(structuredClone(state.swing!));
    rigid.addForce({ x: 0, y: 9.81, z: 0 }, true);
    for (const tick of [1, 2]) {
      if (tick === 2) rigid.resetForces(false);
      world.step();
      const supports: ReturnType<typeof collectPhysicalSupports> =
        collectPhysicalSupports({
          world,
          body: "assembly",
          profile,
          pattern,
          segments: new Map([["root", rigid]]),
          colliders,
          contacts: [],
          seconds: tick / 960,
          dt: 1 / 960,
        });
      assert.equal(supports.length, 1);
      assert.equal(supports[0]!.loaded, tick === 2);
      assert.ok(supports[0]!.samples.length > 0);
      assert.ok(
        supports[0]!.samples.every(
          (point: collectPhysicalSupports.IPoint): boolean =>
            point.carrier === "root",
        ),
      );
      Balance({
        world,
        body: "assembly",
        profile,
        segments: new Map([["root", rigid]]),
        colliders,
        contacts: [],
        policy: {
          pattern,
          maximumStep: 0.5,
          margin: 0,
          duration: 1 / 960,
          height: 0.1,
          stiffness: 100,
          damping: 10,
          maximumForce: 100,
        },
        state,
        targets: { root: profile.segments[0]!.neutral },
        supports,
        seconds: tick / 960,
        dt: 1 / 960,
        gravity: 9.81,
        floor: 0,
      });
      assert.equal((state.landings ?? []).length, tick - 1);
      assert.equal(
        state.steps[0]!.resolved?.status,
        tick === 1 ? undefined : "landed",
      );
    }
  } finally {
    world.free();
  }
}
