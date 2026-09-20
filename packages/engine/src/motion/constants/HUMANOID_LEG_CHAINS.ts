import { IAutoMoviePlantChain } from "../IAutoMoviePlantChain";

/**
 * The humanoid leg chains, the default both plant passes pin.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Applies the shared contact policy to the two canonical foot effectors.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Supplies the default bilateral support set for humanoid planting.
 */
export const HUMANOID_LEG_CHAINS: readonly IAutoMoviePlantChain[] = [
  { effector: "leftFoot", upper: "leftUpperLeg", lower: "leftLowerLeg" },
  { effector: "rightFoot", upper: "rightUpperLeg", lower: "rightLowerLeg" },
];
