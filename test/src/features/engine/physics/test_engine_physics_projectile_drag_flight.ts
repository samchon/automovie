import {
  AutoMovieEnginePhysicalProjectile,
} from "@automovie/engine";
import type {
  IAutoMovieHit,
  IAutoMovieProjectile,
  IAutoMovieProjectileFlight,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";
import { nclose } from "../../internal/predicates";

/**
 * Zero drag preserves accelerating-flight contact resolution and bounded reader
 * requests.
 *
 * Scenarios:
 *
 * 1. Each zero drag factor yields no finite all-time speed bound under gravity and
 *    still detects passage through a thin sphere.
 * 2. A zero-gravity zero-drag flight retains its finite launch-speed bound.
 * 3. Both direct readers refuse nonfinite time; finite negative reads hold launch
 *    state and the first interval.
 * 4. Direct flight construction rejects nonfinite vector components and an
 *    overflowing drag factor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States global speed-bound and reader behavior for zero drag and the refusal of nonfinite launch data or query times.
 * @evidence contracts/development/testing.md#behavioral-verification Builds direct drag-flight readers with each drag factor set to zero and queries thin colliders, prelaunch time and invalid parameters.
 * @evidence contracts/development/testing.md#independent-expectations Gravity permits unbounded speed with zero drag, while zero gravity retains launch speed. A thin collider fixture catches an unsound finite bound and finite prelaunch time retains phase zero.
 */
export function test_engine_physics_projectile_drag_flight(): void {
  for (const zero of ["coefficient", "area", "density"] as const) {
    const projectile: IAutoMovieProjectile = {
      origin: { x: 0, y: 1, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      gravity: { x: 0, y: -10, z: 0 },
      drag: { coefficient: 1, area: 1, density: 1, mass: 1, [zero]: 0 },
    };
    const flight: IAutoMovieProjectileFlight = AutoMovieEnginePhysicalProjectile.dragFlight(projectile);
    TestValidator.predicate(
      `${zero}=0 has an unbounded global speed`,
      flight.fastest === Infinity,
    );
    const hit: IAutoMovieHit | null = AutoMovieEnginePhysicalProjectile.firstContact(
      projectile,
      [
        AutoMovieEnginePhysicalProjectile.shapeCollider(
          "sphere",
          {
            id: "sphere",
            material: "solid",
            kind: "sphere",
            radius: 0.1,
            transform: {
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 0, y: 0, z: 0, w: 1 },
            },
          },
          (): IAutoMovieRigidTransform => ({
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
          }),
        ),
      ],
      { from: 0, to: 1 },
      { radius: 0, thickness: 0.05 },
    );
    TestValidator.predicate(
      `${zero}=0 detects the thin collider`,
      hit !== null &&
        Math.abs(hit.time - Math.sqrt(0.18)) < PhysicalTolerance.CONTACT_TIME,
    );
    for (const seconds of [Infinity]) {
      assert.throws((): void => {
        flight.at(seconds);
      }, RangeError);
      assert.throws((): void => {
        flight.interval(seconds);
      }, RangeError);
    }
    TestValidator.predicate(
      "finite prelaunch reads hold the launch",
      nclose(flight.at(-1).position.y, 1) &&
        nclose(flight.interval(-1).from, 0),
    );
  }
  const constant: IAutoMovieProjectile = {
    origin: { x: 0, y: 0, z: 0 },
    velocity: { x: 3, y: 4, z: 0 },
    gravity: { x: 0, y: 0, z: 0 },
    drag: { coefficient: 0, area: 1, mass: 1 },
  };
  TestValidator.predicate(
    "zero gravity keeps the launch-speed bound",
    nclose(AutoMovieEnginePhysicalProjectile.dragFlight(constant).fastest, 5),
  );
  assert.throws((): void => {
    AutoMovieEnginePhysicalProjectile.dragFlight({
      ...constant,
      drag: {
        coefficient: Number.MAX_VALUE,
        area: Number.MAX_VALUE,
        density: 1,
        mass: 1,
      },
    });
  }, RangeError);
}
