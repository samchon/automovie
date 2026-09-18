import { AutoMovieHumanoidBone } from "@automovie/interface";
import { HUMANOID_LEG_CHAINS } from "./HUMANOID_LEG_CHAINS";

/**
 * The leg chain that plants one foot: the foot end-effector and its upper/lower
 * segments (hip→knee, knee→ankle).
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Declares the articulated chain whose foot is judged against the ground contact.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Defines one support limb for stance detection and correction.
 * @author Samchon
 */
export interface IAutoMovieFootLeg {
  /**
   * Foot end-effector bone (the ground-contact point that is pinned).
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Identifies the bone whose world position is constrained to the ground target.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Selects the effector that supplies and receives support.
   */
  foot: AutoMovieHumanoidBone;
  /**
   * Upper leg segment (thigh): the chain root.
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Anchors the leg correction at its declared proximal segment.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Establishes the first link that transfers the planted support.
   */
  upper: AutoMovieHumanoidBone;
  /**
   * Lower leg segment (shin).
   *
   * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Identifies the hinge segment adjusted to keep the foot on its target.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Establishes the second articulated link in the support solve.
   */
  lower: AutoMovieHumanoidBone;
}

/**
 * The humanoid legs, named from the shared chain table so the ground-IK pass
 * and the retarget contact pass cannot disagree about which bones a leg is.
 */
const DEFAULT_LEGS: readonly IAutoMovieFootLeg[] = HUMANOID_LEG_CHAINS.map(
  (chain) => ({
    foot: chain.effector,
    upper: chain.upper,
    lower: chain.lower,
  }),
);
