import {
  AutoMovieXpbdBody,
  AutoMovieXpbdWorld,
  physicalJointInertia,
  samplePhysicalTarget,
} from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A ninety-degree frame exchanges two unequal world inertia axes. Two free
 * bodies have harmonic relative inertia, independently of segment labels.
 * A translating/rotating authored target supplies the same velocities at
 * intermediate samples; a wrapped quaternion takes the short physical arc.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `physicalJointInertia` on two in-house solver bodies and `samplePhysicalTarget` on explicit poses, and asserts the returned values through 2x TestValidator.predicate. A joint inertia that read the frame unrotated or combined the two bodies other than harmonically fails the first; a sampler whose velocities left the interpolant or took the long arc fails the second.
 * @evidence contracts/development/testing.md#independent-expectations The expected moments follow by hand from the declared principal inertias: the 90-degree z frame maps the child's world (2, 3, 4) to joint axes (3, 2, 4) against the parent's (1, 1, 1), and 1 / (1/3 + 1) = 0.75, 1 / (1/2 + 1) = 2/3, 1 / (1/4 + 1) = 0.8. The target's 4 m/s and 0.4 rad/s follow from 2 m over 0.5 s and the 0.2 rad short arc.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers unequal axes under a rotated frame, two dynamic bodies and a sign-wrapped quaternion end; a parentless joint and joint motors are owned by the tracking tests.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_tracking_coordinates`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A ninety-degree frame exchanges two unequal world inertia axes) and the sampler case as stated in this comment.
 */
export async function test_unit_engine_physics_physical_joint_inertia(): Promise<void> {
  const world: AutoMovieXpbdWorld = new AutoMovieXpbdWorld({
    x: 0,
    y: 0,
    z: 0,
  });
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const child: AutoMovieXpbdBody = world.createBody(true, {
    position: { x: 0, y: 0, z: 0 },
    rotation: identity,
  });
  child.setMass(1, { x: 0, y: 0, z: 0 }, { x: 2, y: 3, z: 4 }, identity);
  const parent: AutoMovieXpbdBody = world.createBody(true, {
    position: { x: 0, y: 0, z: 0 },
    rotation: identity,
  });
  parent.setMass(1, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, identity);
  const inertia: ReturnType<typeof physicalJointInertia> = physicalJointInertia(
    { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
    child,
    parent,
  );
  TestValidator.predicate(
    "rotated world tensors combine both bodies harmonically",
    Math.abs(inertia.x - 0.75) < 1e-7 &&
      Math.abs(inertia.y - 2 / 3) < 1e-7 &&
      Math.abs(inertia.z - 0.8) < 1e-7,
  );
  const target: ReturnType<typeof samplePhysicalTarget> = samplePhysicalTarget(
    { position: { x: 1, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
    {
      position: { x: 3, y: 0, z: 0 },
      rotation: { x: 0, y: -Math.sin(0.1), z: 0, w: -Math.cos(0.1) },
    },
    0.25,
    2,
  );
  TestValidator.predicate(
    "authored point and angular velocities share the interpolant",
    Math.abs(target.pose.position.x - 1.5) < 1e-12 &&
      target.velocity.x === 4 &&
      Math.abs(target.angularVelocity.y - 0.4) < 1e-12,
  );
}
