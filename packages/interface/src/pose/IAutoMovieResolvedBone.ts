import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";

/**
 * One bone's transform after `resolvePose`'s forward-kinematics walk.
 *
 * `localRotation` is what a renderer sets on the bone; the world fields are
 * what physics validators, attachments and IK read. World means model space
 * after the pose's root transform, in metres. Only root-reachable bones are
 * resolved, parents before children.
 */
export interface IAutoMovieResolvedBone {
  /** The bone this transform belongs to. */
  bone: AutoMovieHumanoidBone;

  /**
   * Local rotation to set on the bone: its rest rotation times the pose's
   * articulation.
   */
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
