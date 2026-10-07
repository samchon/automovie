import type {
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Clinical articulation of a two-link target candidate before final clamping.
 * The caller evaluates its effective ROM and actual FK residual; this record
 * carries no claim that the target is reachable or that contact succeeded.
 *
 * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-reachability Carries the two actual candidate articulations from a measured contact chain.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Keeps candidate rotations and bend-axis identity together for unchanged final contact scoring.
 * @author Samchon
 */
export interface IAutoMovieSolvedChainPlant {
  /** Root joint's selected clinical coordinate chart. */
  upper: IAutoMovieJointPose;

  /** Mid joint's selected clinical coordinate chart. */
  lower: IAutoMovieJointPose;

  /** Original hinge direction in the resolved model frame. */
  hinge: IAutoMovieVector3;
}
