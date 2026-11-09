import type { World } from "@dimforge/rapier3d-compat";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { configurePhysicalBodyQuality } from "./configurePhysicalBodyQuality";
import { configurePhysicalJointMotor } from "./configurePhysicalJointMotor";
import { physicalReleasedQuality } from "./physicalReleasedQuality";

/**
 * Withdraw all default actuator effort once, preserving passive damping, native constraints and warm starts. The caller verifies that no explicit protective joint remains active.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Withdraw all default actuator effort once, preserving passive damping, native constraints and warm starts) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Withdraw all default actuator effort once, preserving passive damping, native constraints and warm starts) directly over its typed inputs (`world`, `input`, `body`, `bound`) as 3 sequential passes (for-of over bound.segments.get(body.id)!.values(); for-of over body.profile.joints; for-of over bound.segments.get(body.id)!.values()), delegating to `configurePhysicalBodyQuality`, `rigid.resetForces`, `rigid.resetTorques`, `configurePhysicalJointMotor`, `physicalReleasedQuality`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 35 lines and 7 top-level statements that reuses `configurePhysicalBodyQuality`, `rigid.resetForces`, `rigid.resetTorques`, `configurePhysicalJointMotor`, `physicalReleasedQuality` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 4 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `world`, `input`, `body`, `bound`; the dominant cost is 3 sequential passes (for-of over bound.segments.get(body.id)!.values(); for-of over body.profile.joints; for-of over bound.segments.get(body.id)!.values()), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.
 */
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
  const budget: ReturnType<typeof physicalReleasedQuality> =
    physicalReleasedQuality({
      quality: body.releasedQuality,
      released: true,
      iterations: input.iterations,
      internalIterations: input.internalIterations!,
    });
  for (const rigid of bound.segments.get(body.id)!.values()) {
    if (body.releasedQuality && !body.releasedQuality.duringReflex) {
      rigid.setAdditionalSolverIterations(budget.solver);
      rigid.setAdditionalPgsIterations(budget.pgs);
    }
    rigid.resetForces(false);
    rigid.resetTorques(false);
  }
  bound.released.add(body.id);
}
