import { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * One scored candidate articulation.
 *
 * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-reachability Represents a reachable two-joint candidate together with its limit cost.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Exposes the articulation selected by the bounded IK search.
 */
export interface IAutoMovieHingedArticulation {
  /**
   * Bone-local articulation delta for the chain-root joint (the shoulder).
   *
   * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-solve-order Carries the upper-joint correction produced before limit validation.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Preserves the shoulder component of the selected IK articulation.
   */
  upper: IAutoMovieQuaternion;

  /**
   * Bone-local articulation delta for the mid joint (the elbow): a pure
   * rotation about that joint's own flexion axis, so its abduction and twist
   * decompose to exactly zero.
   *
   * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-coupled-range-drivers Restricts the elbow result to its declared hinge control.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Preserves the hinge-only lower-joint component of the selected solve.
   */
  lower: IAutoMovieQuaternion;

  /**
   * Total ROM overshoot of the chosen candidate in degrees, `0` when the pose
   * satisfies both joints. Reported rather than hidden: a rig whose declared
   * ranges genuinely cannot hold any pose that reaches the target must still
   * say so, instead of the solver quietly returning its least-bad attempt as if
   * it were clean.
   *
   * `Infinity` when the scorer found a violation with no measurable overshoot,
   * which {@link jointRomOvershoot} reserves for a non-finite angle: unusable
   * rather than free, so a malformed candidate can never win the selection.
   *
   * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-solve-failure Quantifies the remaining limit violation instead of hiding an impossible target.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Reports the selected candidate's bounded-solve failure magnitude.
   */
  overshoot: number;
}
