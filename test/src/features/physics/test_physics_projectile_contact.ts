import type { IAutoMovieHit, IAutoMovieProjectile, IAutoMoviePhysicalProfile } from "@automovie/interface";
import { Vector3, projectileFirstContact } from "@automovie/engine";

import { TestValidator } from "@nestia/e2e";

/**
 * A projectile's first contact (#3478) through the one contact resolver.
 *
 * Scenarios:
 *
 * 1. An arrow, a capsule 0.7 m long flying point first at 60 m/s along +Z
 *    with no gravity, meets a 0.06 m-diameter capsule standing across its
 *    path 10 m ahead at the analytic entry time, (10 - 0.03) / 60 s, within
 *    1e-5 s, with the analytic normal -Z.
 * 2. A ball dropped from 1 m meets the ground plane with the plane's +Y
 *    normal at sqrt(2 h / g) within 1e-5 s.
 * 3. A flight passing between two colliders meets nothing.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Finds the contacts of a fast capsule, a falling sphere and a miss; a coarse step that tunnels, a wrong normal or a false contact fails one.
 * @evidence contracts/development/testing.md#independent-expectations Entry times are the geometry over the speed and the free-fall time, written here.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a thin capsule, a plane and a gap.
 * @evidence contracts/development/testing.md#execution-ownership The named unit calls the engine's contact search directly.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three numbered scenarios with their inputs and bounds.
 */
export function test_physics_projectile_contact(): void {
  const zero = { x: 0, y: 0, z: 0 };
  const post = (z: number, x: number): IAutoMoviePhysicalProfile.IShape => ({
    id: "post",
    material: "wood",
    kind: "capsule",
    radius: 0.03,
    halfLength: 0.5,
    transform: {
      position: { x, y: 1, z },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
  });
  const pose = (): IAutoMoviePhysicalProfile.ITransform => ({
    position: zero,
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  });

  // 1. The arrow and the thin post.
  const arrow: IAutoMovieProjectile = {
    origin: { x: 0, y: 1, z: 0 },
    velocity: { x: 0, y: 0, z: 60 },
    gravity: zero,
    attitude: { kind: "fixed" },
  };
  const hit: IAutoMovieHit | null = projectileFirstContact(
    arrow,
    [projectileFirstContact.shape("post", post(10, 0), pose)],
    { from: 0, to: 1 },
    { radius: 0, tail: { x: 0, y: 0, z: -0.7 }, thickness: 0.06 },
  );
  TestValidator.predicate(
    `the arrow meets the post at its entry (${hit?.time} s)`,
    hit !== null && Math.abs(hit.time - (10 - 0.03) / 60) <= 1e-5,
  );
  TestValidator.predicate(
    "the post's normal faces the arrow",
    hit !== null && Vector3.dot(hit.normal!, { x: 0, y: 0, z: -1 }) >= 1 - 1e-6,
  );

  // 2. The ball on the ground.
  const drop: IAutoMovieHit | null = projectileFirstContact(
    {
      origin: { x: 0, y: 1, z: 0 },
      velocity: zero,
      gravity: { x: 0, y: -9.80665, z: 0 },
    },
    [projectileFirstContact.plane("ground", zero, { x: 0, y: 1, z: 0 })],
    { from: 0, to: 2 },
    { radius: 0, thickness: 0.05 },
  );
  TestValidator.predicate(
    `the ball lands at sqrt(2h/g) (${drop?.time} s)`,
    drop !== null && Math.abs(drop.time - Math.sqrt(2 / 9.80665)) <= 1e-5,
  );
  TestValidator.predicate(
    "the ground's normal is up",
    drop !== null && drop.normal!.y >= 1 - 1e-9,
  );

  // 3. Between two posts.
  const miss: IAutoMovieHit | null = projectileFirstContact(
    arrow,
    [
      projectileFirstContact.shape("left", post(10, 0.2), pose),
      projectileFirstContact.shape("right", post(10, -0.2), pose),
    ],
    { from: 0, to: 1 },
    { radius: 0, tail: { x: 0, y: 0, z: -0.7 }, thickness: 0.06 },
  );
  TestValidator.predicate(
    "a flight between two posts meets nothing",
    miss === null,
  );
}
