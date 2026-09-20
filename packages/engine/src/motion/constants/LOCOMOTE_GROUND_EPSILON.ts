/**
 * Distance below which a ground-travel displacement is treated as zero.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Establishes the numeric tolerance used to distinguish grounded travel from no displacement.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Bounds the ground-support classification against floating-point residue.
 */
export const LOCOMOTE_GROUND_EPSILON = 1e-6;
