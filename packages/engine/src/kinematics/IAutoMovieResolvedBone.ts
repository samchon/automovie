import { AutoMovieHumanoidBone, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * A resolved bone transform after forward kinematics: the bone's local rotation
 * (rest ∘ articulation) and its world position.
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rest-bind-deformation Captures one bone transform after composing its declared rest-space articulation.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-skin-rigid-morph-deformation Carries one hierarchy-composed bone result.
 */
export interface IAutoMovieResolvedBone {
  /**
   * The bone this transform belongs to.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rest-bind-deformation Retains the stable bone identity whose rest transform was evaluated.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-skin-rigid-morph-deformation Associates each resolved frame with its declared skeleton node.
   */
  bone: AutoMovieHumanoidBone;
  /**
   * Local rotation to set on the bone (rest rotation composed with
   * articulation).
   *
   * @evidence requirements/actors/pose-expression-and-gaze.md#actor-pose-space-authority Keeps articulation in the bone-local space that owns the pose control.
   * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-pose-gaze-expression-state Carries the local pose state applied to the resolved bone.
   */
  localRotation: IAutoMovieQuaternion;
  /**
   * Bone origin in world/model space, after walking the hierarchy.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rest-bind-deformation Resolves the declared parent-local offsets into the bone's current world position.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-skin-rigid-morph-deformation Stores the hierarchy-composed world origin used for spatial queries.
   */
  worldPosition: IAutoMovieVector3;
  /**
   * Bone orientation in world/model space (parent world rotation ∘ local). This
   * is what an **attachment** rides. Fixing a child body's frame in this bone's
   * frame (e.g. a rider in a horse's saddle) parents the two the way a physics
   * joint does.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rest-bind-deformation Accumulates rest and articulation rotations through the declared parent chain.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-skin-rigid-morph-deformation Stores the hierarchy-composed world orientation of the bone.
   */
  worldRotation: IAutoMovieQuaternion;
}
