/**
 * Squared clinical deviation from the anatomical neutral, in degrees².
 *
 * @evidence requirements/motion/constraints-and-inverse-kinematics.md#motion-constraint-reachability Breaks equally reachable candidates toward the declared anatomical neutral.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Supplies the anatomical-neutral prior used to break an otherwise tied candidate score.
 */
export const clinicalDeviation = (joint: {
  flexion: number;
  abduction: number;
  twist: number;
}): number =>
  joint.flexion * joint.flexion +
  joint.abduction * joint.abduction +
  joint.twist * joint.twist;
