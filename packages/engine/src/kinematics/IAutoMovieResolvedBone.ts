import {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * One bone's transform after `resolvePose`'s forward-kinematics walk.
 *
 * `localRotation` is what a renderer sets on the bone; the world fields are
 * what physics validators, attachments and IK read. World means model space
 * after the pose's root transform, in metres. Only root-reachable bones are
 * resolved, parents before children.
 *
 * @evidence contracts/development/design.md#principled-representation Standard hierarchical forward kinematics: local rotation is rest times articulation, world rotation is parent world times local, and world position is parent world position plus the rest translation rotated by the parent's world rotation, so each field is exactly what the walk composed.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Both the local rotation a scene graph needs and the world frame a validator needs in one record, so neither consumer recomputes the walk; it is structurally an `IAutoMovieChainBone` for the IK solvers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A detached bone is omitted rather than given a placeholder transform, so a consumer cannot read a world position the walk never computed.
 * @evidence contracts/development/common.md#meaningful-documentation States who reads which fields, the frame and unit of world values, the composition of each field, and which bones are present in what order.
 */
export interface IAutoMovieResolvedBone {
  /** The bone this transform belongs to. */
  bone: AutoMovieHumanoidBone;

  /** Local rotation to set on the bone: its rest rotation times the pose's articulation. */
  localRotation: IAutoMovieQuaternion;

  /** Bone origin in model space, metres, after walking the hierarchy. */
  worldPosition: IAutoMovieVector3;

  /**
   * Bone orientation in model space, the parent's world rotation times
   * `localRotation`. This is what an attachment rides: fixing a child body's
   * frame in this bone's frame, such as a rider in a horse's saddle, parents
   * the two the way a physics joint does.
   */
  worldRotation: IAutoMovieQuaternion;
}
