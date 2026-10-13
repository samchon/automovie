import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

/**
 * Effective clinical domain used to choose an equivalent quaternion chart.
 *
 * The constraint is the caller's already resolved ROM. Chart selection never
 * clamps a coordinate or changes this domain; a null constraint preserves the
 * principal inverse because no permitted chart is preferred by a range.
 *
 * @author Samchon
 */
export interface IAutoMovieJointRotationDomain {
  /** Actual rig bone whose coordinates the inverse reports. */
  bone: AutoMovieHumanoidBone;

  /** Effective caller-owned ROM; null keeps the unconstrained principal chart. */
  constraint: IAutoMovieJointConstraint | null;
}
