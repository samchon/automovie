import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * Apply one admitted parent-joint-relative rotation to its declared descendant tree, preserving every rigid anchor. Motor targets are mutable working copies, never solved bodies.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Apply one admitted parent-joint-relative rotation to its declared descendant tree, preserving every rigid anchor) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Apply one admitted parent-joint-relative rotation to its declared descendant tree, preserving every rigid anchor) directly over its typed inputs (`targets`, `joint`, `descendants`, `relative`) as a single pass (for-of over descendants), delegating to `Quaternion.multiply`, `Quaternion.inverse`, `Vector3.add`, `Quaternion.rotateVector`, `Vector3.subtract`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 35 lines and 7 top-level statements that reuses `Quaternion.multiply`, `Quaternion.inverse`, `Vector3.add`, `Quaternion.rotateVector`, `Vector3.subtract` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 3 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `targets`, `joint`, `descendants`, `relative`; the dominant cost is a single pass (for-of over descendants), performed once per call. No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 0 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function setPhysicalTargetJointRotation(
  targets: Record<string, P.ITransform>,
  joint: P.IJoint,
  descendants: readonly string[],
  relative: P.ITransform["rotation"],
): void {
  const parent: P.ITransform = targets[joint.parent]!;
  const child: P.ITransform = targets[joint.child]!;
  const frame: P.ITransform["rotation"] = Quaternion.multiply(
    parent.rotation,
    joint.parentFrame.rotation,
  );
  const current: P.ITransform["rotation"] = Quaternion.multiply(
    Quaternion.inverse(frame),
    Quaternion.multiply(child.rotation, joint.childFrame.rotation),
  );
  const rotation: P.ITransform["rotation"] = Quaternion.multiply(
    Quaternion.multiply(
      Quaternion.multiply(frame, relative),
      Quaternion.inverse(current),
    ),
    Quaternion.inverse(frame),
  );
  const pivot: P.ITransform["position"] = Vector3.add(
    parent.position,
    Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
  );
  for (const bone of descendants) {
    const pose: P.ITransform = targets[bone]!;
    pose.position = Vector3.add(
      pivot,
      Quaternion.rotateVector(rotation, Vector3.subtract(pose.position, pivot)),
    );
    // Incremental fits compose onto accepted poses instead of rebuilding
    // from one seed, so renormalize to keep roundoff from accumulating.
    pose.rotation = Quaternion.normalize(
      Quaternion.multiply(rotation, pose.rotation),
    );
  }
}
