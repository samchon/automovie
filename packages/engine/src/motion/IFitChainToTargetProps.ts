import type { AutoMovieHumanoidBone, IAutoMoviePose, IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import type { IAutoMovieSkeletonTopology } from "../kinematics/IAutoMovieSkeletonTopology";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import type { IAutoMoviePlantChain } from "./IAutoMoviePlantChain";

/**
 * Actual rig, target and shared semantic frames for a bounded contact fit.
 * The current pose retains its non-chain joints; a prior pose only ranks
 * equally accurate bend choices. The solver owns no replacement rig limits.
 *
 * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-reachability Carries the actual measured chain, requested contact point and effective rig used by the constrained fit.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Keeps target, semantic frames, topology and prior-pose continuity inputs explicit for the shared contact policy.
 * @author Samchon
 */
export interface IFitChainToTargetProps {
  /** Rig whose ROM and rest transforms constrain the solve. */
  skeleton: IAutoMovieSkeleton;
  /** Current authored pose; returned unchanged when no candidate improves it. */
  pose: IAutoMoviePose;
  /** Ordered root, mid, and end-effector bones of one descendant chain. */
  chain: IAutoMoviePlantChain;
  /** World-space position the end effector should reach. */
  target: IAutoMovieVector3;
  /** Pre-indexed topology belonging to `skeleton`. */
  topology: IAutoMovieSkeletonTopology;
  /** Optional clinical axes used consistently by IK, ROM, and FK. */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  /** Optional clinical rest frames used consistently by IK, ROM, and FK. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
  /**
   * Prior corrected pose used only to stabilize equal-residual bend branches;
   * its root and non-chain joints do not replace the current pose.
   */
  referencePose?: IAutoMoviePose;
}
