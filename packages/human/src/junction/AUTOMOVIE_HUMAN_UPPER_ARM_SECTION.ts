/**
 * The mid upper arm section, which the `upperArm` ring shape reads: four quarter ellipses about the upper arm's bone axis, their half axes toward the front, back, medial side (toward the body) and lateral side as fractions of the section's mean radius, the ring then scaled so its limit girth is the upper arm circumference. The triceps behind is the larger mass and the deltoid's insertion flattens the lateral side. Our least-squares fit of the MakeHuman CC0 reference's section 2 mm below the `upperArm` ring plane, its rays from the axis divided by the section's own mean radius and averaged over the four lean 20-year-old gate identities of the calibration harness (a slim model woman and man, a lean muscular woman and man); RMS residual 0.046 mean radii against 0.095 for a circle about the axis. Grade: population-fitted to a synthetic reference.
 */
export const AUTOMOVIE_HUMAN_UPPER_ARM_SECTION = {
  front: 1.002,
  back: 1.136,
  medial: 0.957,
  lateral: 0.843,
} as const;
