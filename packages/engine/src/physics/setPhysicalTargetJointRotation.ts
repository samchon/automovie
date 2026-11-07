import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/** Apply one admitted parent-joint-relative rotation to its declared descendant tree, preserving every rigid anchor. Motor targets are mutable working copies, never solved bodies. */
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
    pose.rotation = Quaternion.multiply(rotation, pose.rotation);
  }
}
