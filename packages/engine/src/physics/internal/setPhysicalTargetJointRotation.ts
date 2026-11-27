import type {
  IAutoMoviePhysicalJoint,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

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
  const frame: IAutoMovieRigidTransform["rotation"] = AutoMovieEngineQuaternion.multiply(
    parent.rotation,
    joint.parentFrame.rotation,
  );
  const current: IAutoMovieRigidTransform["rotation"] = AutoMovieEngineQuaternion.multiply(
    AutoMovieEngineQuaternion.inverse(frame),
    AutoMovieEngineQuaternion.multiply(child.rotation, joint.childFrame.rotation),
  );
  const rotation: IAutoMovieRigidTransform["rotation"] = AutoMovieEngineQuaternion.multiply(
    AutoMovieEngineQuaternion.multiply(
      AutoMovieEngineQuaternion.multiply(frame, relative),
      AutoMovieEngineQuaternion.inverse(current),
    ),
    AutoMovieEngineQuaternion.inverse(frame),
  );
  const pivot: IAutoMovieRigidTransform["position"] = AutoMovieEngineVector3.add(
    parent.position,
    AutoMovieEngineQuaternion.rotateVector(parent.rotation, joint.parentFrame.position),
  );
  for (const bone of descendants) {
    const pose: IAutoMovieRigidTransform = targets[bone]!;
    pose.position = AutoMovieEngineVector3.add(
      pivot,
      AutoMovieEngineQuaternion.rotateVector(rotation, AutoMovieEngineVector3.subtract(pose.position, pivot)),
    );
    // Incremental fits compose onto accepted poses instead of rebuilding
    // from one seed, so renormalize to keep roundoff from accumulating.
    pose.rotation = AutoMovieEngineQuaternion.normalize(
      AutoMovieEngineQuaternion.multiply(rotation, pose.rotation),
    );
  }
}
