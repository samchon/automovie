import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";
import type { IAutoMovieJointRotationDomain } from "../kinematics/IAutoMovieJointRotationDomain";
import type { Quaternion } from "../math/Quaternion";
import type { IAutoMoviePlantChain } from "./IAutoMoviePlantChain";

/**
 * Pose-invariant chain frames and effective clinical domains prepared for one target.
 * The solver and residual reader share these same rest transforms and constraints;
 * offsets and endpoints use the resolved model metre frame.
 *
 * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-reachability Carries the actual two-link rest geometry used to bound and reconstruct a contact solve.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Retains the compiled chain frames and effective joint domains shared by inverse solving and final effector readback.
 * @author Samchon
 */
export interface IPreparedChainPlant {
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
  lowerRotation: ReturnType<typeof Quaternion.identity>;

  /** Mid-to-effector offset in the mid's local frame, metres. */
  effectorOffset: IAutoMovieVector3;
}
