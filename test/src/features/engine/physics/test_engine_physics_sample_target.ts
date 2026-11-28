import { AutoMovieEnginePhysicalSimulation } from "@automovie/engine";
import type { IAutoMovieRigidTransform } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/predicates";

/**
 * `samplePhysicalTarget` interpolates two goal poses and derives world
 * velocities from the same shortest arc.
 *
 * Goals: identity at the origin, then a quarter turn about z at (2, 0, 0); rate
 * 10 per second.
 *
 * Scenarios:
 *
 * 1. Halfway, the position is (1, 0, 0) and the rotation an eighth turn (z = sin
 *    22.5 degrees).
 * 2. The linear velocity is the displacement times the rate: (20, 0, 0).
 * 3. The angular velocity is the quarter turn times the rate about z: 5 pi.
 * 4. With equal rotations the angular velocity is zero.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes fractional goal position and shortest-arc rotation with world linear and angular velocities.
 * @evidence contracts/development/testing.md#behavioral-verification Samples midway between an identity pose and a translated quarter turn, then repeats with rotation held constant.
 * @evidence contracts/development/testing.md#independent-expectations Linear interpolation gives x = 1 and velocity x = 20 at 10 Hz. Half a quarter turn gives quaternion z = sin 22.5°, while angular speed is 5π or zero.
 */
export function test_engine_physics_sample_target(): void {
  const h: number = Math.SQRT1_2;
  const before: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const after: IAutoMovieRigidTransform = {
    position: { x: 2, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: h, w: h },
  };
  const sampled = AutoMovieEnginePhysicalSimulation.sampleTarget(before, after, 0.5, 10);
  TestValidator.predicate(
    "position",
    nclose(sampled.pose.position.x, 1, 1e-12),
  );
  TestValidator.predicate(
    "rotation",
    nclose(sampled.pose.rotation.z, Math.sin(Math.PI / 8), 1e-12) &&
      nclose(sampled.pose.rotation.w, Math.cos(Math.PI / 8), 1e-12),
  );
  TestValidator.equals("velocity", sampled.velocity, { x: 20, y: 0, z: 0 });
  TestValidator.predicate(
    "angular",
    nclose(sampled.angularVelocity.z, 5 * Math.PI, 1e-9),
  );
  const still = AutoMovieEnginePhysicalSimulation.sampleTarget(
    before,
    { ...before, position: { x: 1, y: 0, z: 0 } },
    1,
    10,
  );
  TestValidator.equals("no turn", still.angularVelocity, { x: 0, y: 0, z: 0 });
}
