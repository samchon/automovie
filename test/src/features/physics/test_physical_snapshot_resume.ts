import {
  type AutoMovieXpbdBody,
  AutoMovieXpbdWorld,
  Quaternion,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A restored world snapshot is the world it was taken from, bit for bit, and
 * steps as it does (`AutoMovieXpbdWorld.takeSnapshot`, `.restoreSnapshot`,
 * `.step`): what a resumed bake rests on.
 *
 * One dynamic body with off-axis mass properties, a tilted pose, linear and
 * angular velocities, one velocity component a negative zero, a pending force
 * and torque, a half gravity scale and a non-default timestep.
 *
 * Scenarios:
 *
 * 1. The restored world's snapshot bytes are the original's, and every state the
 *    body reads, its pose, centre of mass, velocities and pending force and
 *    torque, is the same Float64 value, the negative zero included.
 * 2. One step of each leaves the same snapshot bytes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the body's state, the round trip and the one step compared.
 * @evidence contracts/development/testing.md#behavioral-verification Takes a snapshot, restores it, reads the body's state and steps both worlds once, comparing bytes and values.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the original world itself, value for value with `Object.is`, and its own step; no stored output is read.
 * @evidence contracts/development/testing.md#distinguishing-cases Every field set away from its default, so a restore that drops or defaults any of them, or loses the zero's sign, fails 1; a lost timestep, gravity scale, mass property or pending force moves the step and fails 2. Long runs and contacts across a restore are `test_physical_xpbd_world`'s; choosing and copying the resumed prefix are `test_physical_checkpoint_resume`'s, `test_physical_checkpoint_prefix`'s and `test_physical_checkpoint_ledgers`'.
 * @evidence contracts/development/testing.md#execution-ownership Pure in-memory computation: one world of one body and one direct step call; no simulation run, viewer or file host.
 */
export function test_physical_snapshot_resume(): void {
  const world: AutoMovieXpbdWorld = new AutoMovieXpbdWorld({
    x: 0,
    y: -9.81,
    z: 0,
  });
  world.timestep = 1 / 3840;
  const body: AutoMovieXpbdBody = world.createBody(
    true,
    {
      position: { x: 0.1, y: 1, z: -0.2 },
      rotation: Quaternion.fromAxisAngle({ x: 0.6, y: 0, z: 0.8 }, 30),
    },
    0.5,
  );
  body.setMass(
    2,
    { x: 0.01, y: -0.02, z: 0.03 },
    { x: 0.1, y: 0.2, z: 0.3 },
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 20),
  );
  body.setLinvel({ x: 1, y: -0, z: -0.5 });
  body.setAngvel({ x: 3, y: 1, z: -2 });
  body.addForce({ x: 0.5, y: 0.25, z: 0 });
  body.addTorque({ x: 0, y: 0.1, z: -0.2 });

  const snapshot: Uint8Array = world.takeSnapshot();
  const restored: AutoMovieXpbdWorld =
    AutoMovieXpbdWorld.restoreSnapshot(snapshot);
  const values = (from: AutoMovieXpbdWorld): number[] =>
    from.bodies.flatMap((each: AutoMovieXpbdBody): number[] =>
      [
        each.translation(),
        each.rotation(),
        each.worldCom(),
        each.linvel(),
        each.angvel(),
        each.userForce(),
        each.userTorque(),
      ].flatMap((v: IAutoMovieVector3 & { w?: number }): number[] =>
        v.w === undefined ? [v.x, v.y, v.z] : [v.x, v.y, v.z, v.w],
      ),
    );
  const original: number[] = values(world);
  const copy: number[] = values(restored);
  const same = (a: Uint8Array, b: Uint8Array): boolean =>
    a.length === b.length &&
    a.every((byte: number, i: number) => byte === b[i]);
  const bytes: boolean = same(restored.takeSnapshot(), snapshot);
  const state: boolean =
    original.length === copy.length &&
    original.every((value: number, i: number): boolean =>
      Object.is(value, copy[i]),
    ) &&
    Object.is(restored.bodies[0]!.linvel().y, -0);
  world.step();
  restored.step();
  TestValidator.equals(
    "a restored world is its original and steps as it does",
    { bytes, state, step: same(restored.takeSnapshot(), world.takeSnapshot()) },
    { bytes: true, state: true, step: true },
  );
}
