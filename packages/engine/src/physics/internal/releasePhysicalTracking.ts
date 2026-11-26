import type { IAutoMoviePhysicalSimulationInput } from "@automovie/interface";

import type { AutoMovieXpbdWorld } from "../AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBinding as Bound } from "../IAutoMoviePhysicalBinding";
import { configurePhysicalJointMotor } from "../configurePhysicalJointMotor";

/**
 * Withdraw all default actuator effort once: clear the body's forces and
 * torques and set every joint's motors to zero strength, keeping passive
 * damping and the joint constraints. The caller verifies that no explicit
 * protective joint remains active.
 */
export function releasePhysicalTracking(
  world: AutoMovieXpbdWorld,
  body: IAutoMoviePhysicalSimulationInput.IBody,
  bound: Bound,
): void {
  for (const rigid of bound.segments.get(body.id)!.values()) {
    rigid.resetForces();
    rigid.resetTorques();
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
  bound.released.add(body.id);
}
