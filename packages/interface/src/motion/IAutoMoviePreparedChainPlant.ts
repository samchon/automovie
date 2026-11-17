import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieJointRotationDomain } from "../pose/IAutoMovieJointRotationDomain";
import type { IAutoMovieResolvedBone } from "../pose/IAutoMovieResolvedBone";
import type { IAutoMoviePlantChain } from "./IAutoMoviePlantChain";
import type { IAutoMoviePrepareChainRigConstants } from "./IAutoMoviePrepareChainRigConstants";

/**
 * Pose-invariant chain frames and effective clinical domains prepared for one unchanged source pose.
 * The solver and residual reader share these same rest transforms and constraints;
 * offsets and endpoints use the resolved model metre frame.
 *
 * @evidence contracts/development/design.md#principled-representation Captures articulation-free chain frames under the current parent pose plus root/mid effective clinical domains; local offsets and relative lower/effector rotations reconstruct candidate points and orientations including unchanged intermediate bones.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Separates pose-invariant preparation from candidate-specific target/bend choice so the inverse solve and residual scorer consume identical frames and constraints.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Domains come from the actual skeleton and shared defaults; this record has no alternate rig limits or copied measurement that overrides solved FK.
 * @evidence contracts/development/common.md#meaningful-documentation Describes articulation removal, current parent pose, model-metre coordinates, local offsets and relative lower/effector orientation required to reconstruct a candidate.
 */
export interface IAutoMoviePreparedChainPlant {
  /** Ordered root, mid and effector identities from the caller's chain. */
  chain: IAutoMoviePlantChain;

  /** Effective root clinical domain used by inverse and final ROM scoring. */
  upperDomain: IAutoMovieJointRotationDomain;

  /** Effective mid clinical domain used by inverse and final ROM scoring. */
  lowerDomain: IAutoMovieJointRotationDomain;

  /** Root resolved with this chain's articulation removed, retaining its parent pose. */
  upper: IAutoMovieResolvedBone;

  /** Mid resolved in the same articulation-free chain and current parent pose. */
  lower: IAutoMovieResolvedBone;

  /** Current effector location of that chain, in model metres. */
  end: IAutoMovieVector3;

  /** Declared flexion axis rotated into the resolved model frame. */
  hinge: IAutoMovieVector3;

  /** Root-to-mid offset in the root's local frame, metres. */
  lowerOffset: IAutoMovieVector3;

  /** Mid orientation relative to the root before the candidate articulation. */
  lowerRotation: IAutoMovieQuaternion;

  /** Mid-to-effector offset in the mid's local frame, metres. */
  effectorOffset: IAutoMovieVector3;

  /** Mid-to-effector frame rotation with the effector's own articulation removed; unchanged intermediate bones retain the input pose. */
  effectorBaseRotation: IAutoMovieQuaternion;

  /** The rig-only fit readers of the constants this chain was placed from (`placeChainPlant`), built for the rig and clinical tables its fits pass; absent for a chain read by forward kinematics, whose fit builds its own. */
  rig?: IAutoMoviePrepareChainRigConstants.IRig;
}
