import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * World position and orientation of one resolved bone of an IK chain.
 *
 * The two-bone solvers read a chain's root and mid bones in this shape after
 * forward kinematics, so an {@link IAutoMovieResolvedBone} from `resolvePose`
 * can be passed directly. Positions are metres in model space.
 */
export interface IAutoMovieChainBone {
  /** Bone origin, the joint centre, in model-space metres. */
  worldPosition: IAutoMovieVector3;

  /**
   * Bone orientation in model space: parent world rotation times local
   * rotation.
   */
  worldRotation: IAutoMovieQuaternion;
}
