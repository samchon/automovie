import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * World position and orientation of one resolved bone of an IK chain.
 *
 * The two-bone solvers read a chain's root and mid bones in this shape after
 * forward kinematics, so an {@link IAutoMovieResolvedBone} from `resolvePose`
 * can be passed directly. Positions are metres in model space.
 *
 * @evidence contracts/common.md#principled-implementation The two quantities a closed-form two-bone solve needs from forward kinematics: the joint centres for segment lengths and reach, and the root's world rotation to lower a world delta into bone-local articulation.
 * @evidence contracts/common.md#clear-and-simple-design A structural subset of `IAutoMovieResolvedBone`, so `twoBoneChainArticulation` and `hingedArmArticulation` accept any resolved bone without a conversion and without depending on its name or local rotation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no rig identity or ROM, so the geometry solve cannot special-case a bone; rig policy stays with the caller.
 * @evidence contracts/common.md#meaningful-documentation States its producer and consumers, the structural compatibility with resolved bones, and the unit and frame of both members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A pair of world-frame values read by the solvers; no computation happens on this record itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A view of forward-kinematics output; the caller decides how often to resolve.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds a vector and a quaternion by reference for the duration of one solve.
 * @author Samchon
 */
export interface IAutoMovieChainBone {
  /** Bone origin, the joint centre, in model-space metres. */
  worldPosition: IAutoMovieVector3;

  /** Bone orientation in model space: parent world rotation times local rotation. */
  worldRotation: IAutoMovieQuaternion;
}
