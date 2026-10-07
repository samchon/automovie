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
 * @evidence requirements/asset-authoring/rig-and-state.md#asset-rig-basis-controls Retains the bone identity and effective semantic-control domain while recovering clinical coordinates from a quaternion.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Gives inverse conversion the same joint domain its downstream ROM graph evaluates.
 * @author Samchon
 */
export interface IAutoMovieJointRotationDomain {
  /** Actual rig bone whose coordinates the inverse reports. */
  bone: AutoMovieHumanoidBone;

  /** Effective caller-owned ROM; null keeps the unconstrained principal chart. */
  constraint: IAutoMovieJointConstraint | null;
}
