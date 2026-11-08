import RAPIER, { type RigidBody, type World } from "@dimforge/rapier3d-compat";
import { TestValidator } from "@nestia/e2e";

import { physicalJointInertia } from "../../../../packages/engine/src/physics/physicalJointInertia";
import { samplePhysicalTarget } from "../../../../packages/engine/src/physics/samplePhysicalTarget";

/**
 * A ninety-degree frame exchanges two unequal world inertia axes. Two free
 * bodies have harmonic relative inertia, independently of segment labels.
 * A translating/rotating authored target supplies the same velocities at
 * intermediate samples; a wrapped quaternion takes the short physical arc.
 */
export async function test_physical_tracking_coordinates(): Promise<void> {
  await RAPIER.init();
  const world: World = new RAPIER.World({ x: 0, y: 0, z: 0 });
  try {
    const child: RigidBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setAdditionalMassProperties(
        1,
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 3, z: 4 },
        { x: 0, y: 0, z: 0, w: 1 },
      ),
    );
    const parent: RigidBody = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setAdditionalMassProperties(
        1,
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1 },
        { x: 0, y: 0, z: 0, w: 1 },
      ),
    );
    child.recomputeMassPropertiesFromColliders();
    parent.recomputeMassPropertiesFromColliders();
    const inertia: ReturnType<typeof physicalJointInertia> =
      physicalJointInertia(
        { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
        child,
        parent,
      );
    TestValidator.predicate(
      "rotated native tensors preserve both bodies despite pooled buffers",
      Math.abs(inertia.x - 0.75) < 1e-7 &&
        Math.abs(inertia.y - 2 / 3) < 1e-7 &&
        Math.abs(inertia.z - 0.8) < 1e-7,
    );
  } finally {
    world.free();
  }
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
