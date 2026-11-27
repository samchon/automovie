import type {
  IAutoMoviePhysicalJoint,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";

/*
 * Apply one admitted parent-joint-relative rotation to its declared descendant
 * tree, preserving every rigid anchor. Motor targets are mutable working
 * copies, never solved bodies.
 */
export function setPhysicalTargetJointRotation(
  targets: Record<string, IAutoMovieRigidTransform>,
  joint: IAutoMoviePhysicalJoint,
  descendants: readonly string[],
  relative: IAutoMovieRigidTransform["rotation"],
): void {
  const parent: IAutoMovieRigidTransform = targets[joint.parent]!;
  const child: IAutoMovieRigidTransform = targets[joint.child]!;
  const frame: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
    parent.rotation,
    joint.parentFrame.rotation,
  );
  const current: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
    Quaternion.inverse(frame),
    Quaternion.multiply(child.rotation, joint.childFrame.rotation),
  );
  const rotation: IAutoMovieRigidTransform["rotation"] = Quaternion.multiply(
    Quaternion.multiply(
      Quaternion.multiply(frame, relative),
      Quaternion.inverse(current),
    ),
    Quaternion.inverse(frame),
  );
  const pivot: IAutoMovieRigidTransform["position"] = Vector3.add(
    parent.position,
    Quaternion.rotateVector(parent.rotation, joint.parentFrame.position),
  );
  for (const bone of descendants) {
    const pose: IAutoMovieRigidTransform = targets[bone]!;
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
