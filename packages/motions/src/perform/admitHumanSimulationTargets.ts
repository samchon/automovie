import {
  Quaternion,
  Vector3,
  physicalSupportPoint,
  projectPhysicalJointRotation,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

/**
 * A displayed pose's segment frames as the solver can hold them: every
 * joint's relative rotation projected into the profile's own joint limits,
 * and every segment placed from its parent through the joint's anchors.
 *
 * The rig's range of motion and the profile's joint limits are two
 * descriptions of one body, and a displayed pose that satisfies the first
 * can pass the second by a fraction of a milliradian (a thumb's), or carry
 * an anchor offset where the rig articulates a bone the profile does not
 * carry. The solver returns a subtree to its targets exactly and refuses a
 * target outside its joints (`assertPhysicalReturnPath`), so the window
 * hands it targets inside them: the root's frame as displayed, each child
 * at its displayed relative rotation projected by the engine's own
 * projection (`projectPhysicalJointRotation`), parent first.
 *
 * @param profile The performer's physical profile.
 * @param displayed The displayed world segment frames, every segment.
 * @returns Fresh admissible world segment frames.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why targets are projected, what is kept and the order.
 * @evidence contracts/development/implementation.md#principled-implementation Composes the articulated chain the solver simulates: a child's rotation is the parent's times the parent anchor frame times the joint rotation times the inverse child anchor frame, and its origin lies where the two anchors meet.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One parent-first walk of the profile's joint tree; the projection is the engine's.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No limit is widened; a rotation inside its limits passes unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(B) for B segments, one projection per joint.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of its arguments.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh frames; retains nothing.
 */
export function admitHumanSimulationTargets(
  profile: IAutoMoviePhysicalProfile,
  displayed: Readonly<Record<string, IAutoMovieRigidTransform>>,
): Record<string, IAutoMovieRigidTransform> {
  const children: Map<string, IAutoMoviePhysicalJoint[]> = new Map();
  for (const joint of profile.joints)
    children.set(joint.parent, [...(children.get(joint.parent) ?? []), joint]);
  const root: IAutoMoviePhysicalSegment = profile.segments.find(
    (segment: IAutoMoviePhysicalSegment): boolean =>
      !profile.joints.some(
        (joint: IAutoMoviePhysicalJoint): boolean =>
          joint.child === segment.bone,
      ),
  )!;
  const admitted: Record<string, IAutoMovieRigidTransform> = {
    [root.bone]: structuredClone(displayed[root.bone]!),
  };
  const walk = (bone: string): void => {
    for (const joint of children.get(bone) ?? []) {
      const parent: IAutoMovieRigidTransform = admitted[joint.parent]!;
      const relative: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.inverse(
          Quaternion.multiply(
            displayed[joint.parent]!.rotation,
            joint.parentFrame.rotation,
          ),
        ),
        Quaternion.multiply(
          displayed[joint.child]!.rotation,
          joint.childFrame.rotation,
        ),
      );
      const rotation: IAutoMovieQuaternion = Quaternion.multiply(
        Quaternion.multiply(parent.rotation, joint.parentFrame.rotation),
        Quaternion.multiply(
          projectPhysicalJointRotation(joint, relative),
          Quaternion.inverse(joint.childFrame.rotation),
        ),
      );
      admitted[joint.child] = {
        position: Vector3.subtract(
          physicalSupportPoint(parent, joint.parentFrame.position),
          Quaternion.rotateVector(rotation, joint.childFrame.position),
        ),
        rotation,
      };
      walk(joint.child);
    }
  };
  walk(root.bone);
  return admitted;
}
