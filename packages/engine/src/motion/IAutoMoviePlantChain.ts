import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * A two-segment chain pinned by its end effector: a leg (hip → knee → ankle) or
 * an arm (shoulder → elbow → hand). The plant solver is limb-agnostic: which
 * bones form the chain is the caller's rig policy, the algebra is not.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Names the limb segments whose effector is solved against an authoritative contact target.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Defines the articulated support chain consumed by contact resolution.
 * @author Samchon
 */
export interface IAutoMoviePlantChain {
  /**
   * End-effector bone driven onto the pinned target (foot / hand).
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Identifies the point whose world contact is authoritative.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Selects the support effector measured after the solve.
   */
  effector: AutoMovieHumanoidBone;
  /**
   * Chain-root segment (thigh / upper arm).
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Anchors contact correction at the declared proximal segment.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Establishes the first articulated link that transfers support.
   */
  upper: AutoMovieHumanoidBone;
  /**
   * Mid segment (shin / forearm).
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Identifies the hinge segment adjusted to reach the contact target.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Establishes the second link of the support chain.
   */
  lower: AutoMovieHumanoidBone;
}
