import {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A resolved bone transform after forward kinematics: the bone's local rotation
 * (rest ∘ articulation) and its world position.
 */
export interface IAutoMovieResolvedBone {
  /** The bone this transform belongs to. */
  bone: AutoMovieHumanoidBone;
  /**
   * Local rotation to set on the bone (rest rotation composed with
   * articulation).
   */
  localRotation: IAutoMovieQuaternion;
  /** Bone origin in world/model space, after walking the hierarchy. */
  worldPosition: IAutoMovieVector3;
  /**
   * Bone orientation in world/model space (parent world rotation ∘ local). This
   * is what an **attachment** rides. Fixing a child body's frame in this bone's
   * frame (e.g. a rider in a horse's saddle) parents the two the way a physics
   * joint does.
   */
  worldRotation: IAutoMovieQuaternion;
}
