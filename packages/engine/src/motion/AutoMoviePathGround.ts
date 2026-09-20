/**
 * A ground-height source for a walked path: a constant plane height, or a
 * heightfield callback `(x, z) → y` (a slope, stairs approximated as a ramp).
 * Real surface geometry is #605; this is the scalar/callback seam it will
 * refine.
 *
 * @evidence requirements/motion/procedural-motion-and-gaits.md#motion-terrain-adaptation Lets the gait sample the authored ground height along its route.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-procedural-gait-rule Defines the deterministic terrain input consumed by path gait baking.
 */
export type AutoMoviePathGround = number | ((x: number, z: number) => number);
