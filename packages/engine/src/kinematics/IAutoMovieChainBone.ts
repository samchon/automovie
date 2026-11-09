import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * World position and orientation of one resolved bone of an IK chain.
 *
 * The two-bone solvers read a chain's root and mid bones in this shape after
 * forward kinematics, so an {@link IAutoMovieResolvedBone} from `resolvePose`
 * can be passed directly. Positions are metres in model space.
 *
 * @evidence contracts/development/design.md#principled-representation The two quantities a closed-form two-bone solve needs from forward kinematics: the joint centres for segment lengths and reach, and the root's world rotation to lower a world delta into bone-local articulation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A structural subset of `IAutoMovieResolvedBone`, so `twoBoneChainArticulation` and `hingedArmArticulation` accept any resolved bone without a conversion and without depending on its name or local rotation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no rig identity or ROM, so the geometry solve cannot special-case a bone; rig policy stays with the caller.
 * @evidence contracts/development/common.md#meaningful-documentation States its producer and consumers, the structural compatibility with resolved bones, and the unit and frame of both members.
 */
export interface IAutoMovieChainBone {
  /** Bone origin, the joint centre, in model-space metres. */
  worldPosition: IAutoMovieVector3;

  /** Bone orientation in model space: parent world rotation times local rotation. */
  worldRotation: IAutoMovieQuaternion;
}
