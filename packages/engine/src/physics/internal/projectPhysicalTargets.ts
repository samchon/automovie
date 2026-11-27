import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMovieProjectPhysicalTargets,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";

/*
 * Convert authored placements into the declared fixed-pivot physical tree.
 * Preserve root placement and requested parent-relative rotations, project
 * every native angular coordinate, then reconstruct coincident anchors in
 * parent order. Report the largest translation and angular adjustment so an
 * author can detect a physical approximation that changes the intended pose.
 * This operates on motor goals only, never on a simulated or displayed frame.
 */
export function projectPhysicalTargets(
  profile: IAutoMoviePhysicalProfile,
  authored: Readonly<Record<string, IAutoMovieRigidTransform>>,
): IAutoMovieProjectPhysicalTargets.IResult {
  const targets: Record<string, IAutoMovieRigidTransform> = Object.create(null);
  const children: Set<string> = new Set(
    profile.joints.map((joint: IAutoMoviePhysicalJoint): string => joint.child),
  );
  for (const segment of profile.segments)
    if (!children.has(segment.bone))
      targets[segment.bone] = structuredClone(authored[segment.bone]!);
  const pending: Set<IAutoMoviePhysicalJoint> = new Set(profile.joints);
  let maximumTranslation: number = 0;
  let maximumRotation: number = 0;
  while (pending.size) {
    const before: number = pending.size;
    for (const joint of pending) {
      const parent: IAutoMovieRigidTransform | undefined =
        targets[joint.parent];
      if (!parent) continue;
      const originalParent: IAutoMovieRigidTransform = authored[joint.parent]!;
      const originalChild: IAutoMovieRigidTransform = authored[joint.child]!;
      if (!originalParent || !originalChild)
        throw new Error(`Missing physical target at ${joint.id}`);
      const original: IAutoMovieRigidTransform["rotation"] =
        AutoMovieEngineQuaternion.multiply(
          AutoMovieEngineQuaternion.inverse(
            AutoMovieEngineQuaternion.multiply(
              originalParent.rotation,
              joint.parentFrame.rotation,
            ),
          ),
          AutoMovieEngineQuaternion.multiply(
            originalChild.rotation,
            joint.childFrame.rotation,
          ),
        );
      const relative: IAutoMovieRigidTransform["rotation"] =
        projectPhysicalJointRotation(joint, original);
      const rotation: IAutoMovieRigidTransform["rotation"] =
        AutoMovieEngineQuaternion.multiply(
          AutoMovieEngineQuaternion.multiply(
            AutoMovieEngineQuaternion.multiply(parent.rotation, joint.parentFrame.rotation),
            relative,
          ),
          AutoMovieEngineQuaternion.inverse(joint.childFrame.rotation),
        );
      const position: IAutoMovieRigidTransform["position"] = AutoMovieEngineVector3.subtract(
        AutoMovieEngineVector3.add(
          parent.position,
          AutoMovieEngineQuaternion.rotateVector(parent.rotation, joint.parentFrame.position),
        ),
        AutoMovieEngineQuaternion.rotateVector(rotation, joint.childFrame.position),
      );
      targets[joint.child] = { position, rotation };
      maximumTranslation = Math.max(
        maximumTranslation,
        AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(position, originalChild.position)),
      );
      const delta: IAutoMovieRigidTransform["rotation"] = AutoMovieEngineQuaternion.multiply(
        AutoMovieEngineQuaternion.inverse(originalChild.rotation),
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
