import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { AutoMoviePhysicalSimulation } from "./AutoMoviePhysicalSimulation";
import type { AutoMoviePhysicsCache as Cache } from "./AutoMoviePhysicsCache";
import { samplePhysicalTarget } from "./samplePhysicalTarget";

/**
 * Authored state remains first-class and uses finite differences only for reported velocities.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Authored state remains first-class and uses finite differences only for reported velocities) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Authored state remains first-class and uses finite differences only for reported velocities) directly over its typed inputs (`input`, `step`) as nested iteration of depth 2 (for-of over input.bodies; for-of over body.profile.segments), delegating to `Object.create`, `Math.max`, `structuredClone`, `Vector3.scale`, `Vector3.subtract`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 23 lines and 3 top-level statements that reuses `Object.create`, `Math.max`, `structuredClone`, `Vector3.scale`, `Vector3.subtract` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 5 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`, `step`; the dominant cost is nested iteration of depth 2 (for-of over input.bodies; for-of over body.profile.segments), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function createPhysicalKinematicFrame(
  input: AutoMoviePhysicalSimulation.IInput,
  step: number,
): Cache.IFrame {
  const bodies: Cache.IFrame["bodies"] = Object.create(null);
  for (const body of input.bodies) {
    bodies[body.id] = Object.create(null);
    for (const segment of body.profile.segments) {
      const pose: P.ITransform = body.targets[step]!.segments[segment.bone]!;
      const before: P.ITransform =
        body.targets[Math.max(0, step - 1)]!.segments[segment.bone]!;
      bodies[body.id]![segment.bone] = {
        ...structuredClone(pose),
        velocity: Vector3.scale(
          Vector3.subtract(pose.position, before.position),
          step === 0 ? 0 : input.rate,
        ),
        angularVelocity:
          step === 0
            ? { x: 0, y: 0, z: 0 }
            : samplePhysicalTarget(before, pose, 1, input.rate).angularVelocity,
      };
    }
  }
  return { seconds: step / input.rate, bodies };
}
