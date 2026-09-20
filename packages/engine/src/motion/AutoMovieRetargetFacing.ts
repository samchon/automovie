/**
 * Root-facing policy for v1 retargeting: keep the authored root rotation.
 *
 * @evidence requirements/motion/retargeting-and-scale.md#motion-retarget-mapping-selection Makes preservation of source facing an explicit retarget decision.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-retarget-scale-contact Prevents the target conversion from inventing a new root orientation.
 */
export type AutoMovieRetargetFacing = "preserve-authored";
