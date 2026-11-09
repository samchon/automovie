import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Locate the actual joint anchor even when a primitive's bone origin is its solid centre.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Locate the actual joint anchor even when a primitive's bone origin is its solid centre) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Locate the actual joint anchor even when a primitive's bone origin is its solid centre) directly over its typed inputs (`profile`, `bone`, `targets`) as a single pass (find over profile.joints), delegating to `Vector3.add`, `Quaternion.rotateVector`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 14 lines and 4 top-level statements that reuses `Vector3.add`, `Quaternion.rotateVector` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `profile`, `bone`, `targets`; the dominant cost is a single pass (find over profile.joints), performed once per call with 2 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 2 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function physicalJointPoint(
  profile: P,
  bone: string,
  targets: Readonly<Record<string, P.ITransform>>,
): IAutoMovieVector3 {
  const pose: P.ITransform | undefined = targets[bone];
  if (!pose) throw new Error(`Physical joint point missing segment ${bone}`);
  const joint: P.IJoint | undefined = profile.joints.find(
    (candidate: (typeof profile.joints)[number]): boolean =>
      candidate.child === bone,
  );
  return joint
    ? Vector3.add(
        pose.position,
        Quaternion.rotateVector(pose.rotation, joint.childFrame.position),
      )
    : { ...pose.position };
}
