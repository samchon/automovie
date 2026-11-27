import { AutoMovieEngineXpbdBody, AutoMovieEngineXpbdWorld, AutoMovieEnginePhysics, AutoMovieEnginePhysicalSimulation } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";

/**
 * How far a joint's effective inertia may stand from its closed form, kg m^2:
 * the native solver reads it in single precision, about 1e-7 of a unit.
 */
const INERTIA: number = 1e-7;

/**
 * A ninety-degree frame exchanges two unequal world inertia axes. Two free
 * bodies have harmonic relative inertia, independently of segment labels. A
 * translating/rotating authored target supplies the same velocities at
 * intermediate samples; a wrapped quaternion takes the short physical arc.
 */
export async function test_engine_physics_physical_joint_inertia(): Promise<void> {
  const world: AutoMovieEngineXpbdWorld = new AutoMovieEngineXpbdWorld({
    x: 0,
    y: 0,
    z: 0,
  });
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const child: AutoMovieEngineXpbdBody = world.createBody(true, {
    position: { x: 0, y: 0, z: 0 },
    rotation: identity,
  });
  child.setMass(1, { x: 0, y: 0, z: 0 }, { x: 2, y: 3, z: 4 }, identity);
  const parent: AutoMovieEngineXpbdBody = world.createBody(true, {
    position: { x: 0, y: 0, z: 0 },
    rotation: identity,
  });
  parent.setMass(1, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, identity);
  const inertia: ReturnType<typeof AutoMovieEnginePhysics.physicalJointInertia> = AutoMovieEnginePhysics.physicalJointInertia(
    { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 },
    child,
    parent,
  );
  TestValidator.predicate(
    "rotated world tensors combine both bodies harmonically",
    Math.abs(inertia.x - 0.75) < INERTIA &&
      Math.abs(inertia.y - 2 / 3) < INERTIA &&
      Math.abs(inertia.z - 0.8) < INERTIA,
  );
  const target: ReturnType<typeof AutoMovieEnginePhysicalSimulation.sampleTarget> = AutoMovieEnginePhysicalSimulation.sampleTarget(
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
    Math.abs(target.pose.position.x - 1.5) < PhysicalTolerance.ROUNDING &&
      target.velocity.x === 4 &&
      Math.abs(target.angularVelocity.y - 0.4) < PhysicalTolerance.ROUNDING,
  );
}
