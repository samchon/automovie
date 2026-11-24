import {
  type AutoMovieXpbdBody,
  type AutoMovieXpbdCollider,
  AutoMovieXpbdWorld,
  collectPhysicalSupports,
} from "@automovie/engine";
import type {
  IAutoMovieCollectPhysicalSupports,
  IAutoMoviePhysicalProfile as P,
  IAutoMovieFootfallPattern as Pattern,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";
import assert from "node:assert/strict";

import { PhysicalFixtures } from "../../../internal/PhysicalFixtures";

/** Contact depth the world leaves uncorrected in these cases, metres. */
const ALLOWED: number = 1e-5;

/**
 * Touching constraints remain available for allocation, and only actual
 * positive load marks a support loaded, the reading a landing is judged on.
 *
 * Scenarios:
 *
 * 1. A real upward force exactly offsets gravity, leaving a sphere resting half
 *    the allowed error deep with zero floor impulse: the support is collected,
 *    unloaded.
 * 2. Removing that force produces a positive floor impulse: the same support is
 *    loaded.
 */
export async function test_unit_engine_physics_physical_landing_authority(): Promise<void> {
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
  const world: AutoMovieXpbdWorld = new AutoMovieXpbdWorld({
    x: 0,
    y: -9.81,
    z: 0,
  });
  world.timestep = 1 / 960;
  world.allowedError = ALLOWED;
  const rigid: AutoMovieXpbdBody = world.createBody(true, {
    position: { x: 0, y: 0.125 - ALLOWED / 2, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  });
  rigid.setMass(
    1,
    { x: 0, y: 0, z: 0 },
    profile.segments[0]!.inertia,
    profile.segments[0]!.inertiaRotation,
  );
  const source: AutoMovieXpbdCollider = world.createCollider(
    rigid,
    profile.segments[0]!.shapes[0]!,
    0,
    0,
    false,
  );
  const floor: AutoMovieXpbdCollider = world.createCollider(
    world.createBody(false, {
      position: { x: 0, y: -0.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    }),
    {
      id: "floor",
      material: "floor",
      kind: "box",
      halfExtents: { x: 2, y: 0.5, z: 2 },
      transform: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
    },
    0.7,
    0,
    false,
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

  rigid.addForce({ x: 0, y: 9.81, z: 0 });
  for (const tick of [1, 2]) {
    if (tick === 2) rigid.resetForces();
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
        (point: IAutoMovieCollectPhysicalSupports.IPoint): boolean =>
          point.carrier === "root",
      ),
    );
  }
}
