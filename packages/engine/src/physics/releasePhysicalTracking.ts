import type { World } from "@dimforge/rapier3d-compat";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { configurePhysicalBodyQuality } from "./configurePhysicalBodyQuality";
import { configurePhysicalJointMotor } from "./configurePhysicalJointMotor";

/** Withdraw all default actuator effort once, preserving passive damping, native constraints and warm starts. The caller verifies that no explicit protective joint remains active. */
export function releasePhysicalTracking(
  world: World,
  input: Simulation.IInput,
  body: Simulation.IBody,
  bound: Bound,
): void {
  configurePhysicalBodyQuality(bound, input, body, true);
  for (const rigid of bound.segments.get(body.id)!.values()) {
    rigid.resetForces(false);
    rigid.resetTorques(false);
  }
  if (bound.released.has(body.id)) return;
  for (const joint of body.profile.joints)
    configurePhysicalJointMotor({
      world,
      native: bound.joints.get(`${body.id}/${joint.id}`)!,
      joint,
      current: { x: 0, y: 0, z: 0, w: 1 },
      target: { x: 0, y: 0, z: 0, w: 1 },
      velocity: { x: 0, y: 0, z: 0 },
      targetVelocity: { x: 0, y: 0, z: 0 },
      strength: 0,
    });
  for (const rigid of bound.segments.get(body.id)!.values()) {
    if (body.releasedQuality && !body.releasedQuality.duringReflex) {
      rigid.setAdditionalSolverIterations(
        Math.max(0, body.releasedQuality.iterations - input.iterations),
      );
      rigid.setAdditionalPgsIterations(
        Math.max(
          0,
          body.releasedQuality.internalIterations - input.internalIterations!,
        ),
      );
    }
    rigid.resetForces(false);
    rigid.resetTorques(false);
  }
  bound.released.add(body.id);
}
