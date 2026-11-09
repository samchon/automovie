import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";

/**
 * Convert authored placements into the declared fixed-pivot physical tree.
 * Preserve root placement and requested parent-relative rotations, project
 * every native angular coordinate, then reconstruct coincident anchors in
 * parent order. Report the largest translation and angular adjustment so an
 * author can detect a physical approximation that changes the intended pose.
 * This operates on motor goals only, never on a simulated or displayed frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Convert authored placements into the declared fixed-pivot physical tree) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Convert authored placements into the declared fixed-pivot physical tree) directly over its typed inputs (`profile`, `authored`) as nested iteration of depth 2 (map over profile.joints; for-of over profile.segments; while loop), delegating to `Object.create`, `children.has`, `structuredClone`, `Quaternion.multiply`, `Quaternion.inverse`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (2 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 68 lines and 8 top-level statements that reuses `Object.create`, `children.has`, `structuredClone`, `Quaternion.multiply`, `Quaternion.inverse` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 3 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `profile`, `authored`; the dominant cost is nested iteration of depth 2 (map over profile.joints; for-of over profile.segments; while loop), performed once per call with 6 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 6 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function projectPhysicalTargets(
  profile: P,
  authored: Readonly<Record<string, P.ITransform>>,
): {
  targets: Record<string, P.ITransform>;
  maximumTranslation: number;
  maximumRotation: number;
} {
  const targets: Record<string, P.ITransform> = Object.create(null);
  const children: Set<string> = new Set(
    profile.joints.map((joint: P.IJoint): string => joint.child),
  );
  for (const segment of profile.segments)
    if (!children.has(segment.bone))
      targets[segment.bone] = structuredClone(authored[segment.bone]!);
  const pending: Set<P.IJoint> = new Set(profile.joints);
  let maximumTranslation: number = 0;
  let maximumRotation: number = 0;
  while (pending.size) {
    const before: number = pending.size;
    for (const joint of pending) {
      const parent: P.ITransform | undefined = targets[joint.parent];
      if (!parent) continue;
      const originalParent: P.ITransform = authored[joint.parent]!;
      const originalChild: P.ITransform = authored[joint.child]!;
      if (!originalParent || !originalChild)
        throw new Error(`Missing physical target at ${joint.id}`);
      const original: P.ITransform["rotation"] = Quaternion.multiply(
        Quaternion.inverse(
          Quaternion.multiply(
            originalParent.rotation,
            joint.parentFrame.rotation,
          ),
        ),
        Quaternion.multiply(originalChild.rotation, joint.childFrame.rotation),
      );
      const relative: P.ITransform["rotation"] = projectPhysicalJointRotation(
        joint,
        original,
      );
      const rotation: P.ITransform["rotation"] = Quaternion.multiply(
        Quaternion.multiply(
          Quaternion.multiply(parent.rotation, joint.parentFrame.rotation),
          relative,
        ),
        Quaternion.inverse(joint.childFrame.rotation),
      );
      const position: P.ITransform["position"] = Vector3.subtract(
        Vector3.add(
          parent.position,
          Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
        ),
        Quaternion.rotateVector(rotation, joint.childFrame.position),
      );
      targets[joint.child] = { position, rotation };
      maximumTranslation = Math.max(
        maximumTranslation,
        Vector3.length(Vector3.subtract(position, originalChild.position)),
      );
      const delta: P.ITransform["rotation"] = Quaternion.multiply(
        Quaternion.inverse(originalChild.rotation),
        rotation,
      );
      maximumRotation = Math.max(
        maximumRotation,
        2 *
          Math.atan2(Math.hypot(delta.x, delta.y, delta.z), Math.abs(delta.w)),
      );
      pending.delete(joint);
    }
    if (before === pending.size)
      throw new Error("Physical target tree has no reachable parent");
  }
  return { targets, maximumTranslation, maximumRotation };
}
