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
