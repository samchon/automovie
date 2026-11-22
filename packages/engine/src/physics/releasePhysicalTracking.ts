import type { IAutoMoviePhysicalSimulationInput } from "@automovie/interface";

import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { configurePhysicalJointMotor } from "./configurePhysicalJointMotor";

/**
 * Withdraw all default actuator effort once: clear the body's forces and
 * torques and set every joint's motors to zero strength, keeping passive
 * damping and the joint constraints. The caller verifies that no explicit
 * protective joint remains active.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is cleared, what is kept and the caller's obligation.
 * @evidence contracts/development/implementation.md#principled-implementation Zero-strength motor commands leave only the axes' passive damping; the released set makes the withdrawal happen once.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the segments and one over the joints.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every segment and joint of the body is released.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the body's segments and joints.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call acts on the current world.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the released set it updates.
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
