/**
 * The mid upper arm section in the rest pose, which the `upperArm` ring shape and the arm's girth profile read: four quarter ellipses about the upper arm's bone axis, their half axes toward the front, back, medial side (toward the body) and lateral side as fractions of the section's mean radius, the ring then scaled so its limit girth is the upper arm circumference. The triceps behind is the larger mass and the deltoid's insertion flattens the lateral side. Our least-squares fit of the MakeHuman CC0 reference's section 2 mm below the `upperArm` ring plane, its rays from the axis divided by the section's own mean radius and averaged over the four lean 20-year-old gate identities of the calibration harness (a slim model woman and man, a lean muscular woman and man); RMS residual 0.046 mean radii against 0.095 for a circle about the axis. Grade: population-fitted to a synthetic reference.
 *
 * `abducted` converts the measured girth to the rest pose. The upper arm circumference is measured with the arm hanging relaxed at the side (`IAutoMovieHumanIdentity.IArm.upperArmCircumference`), while the rest pose abducts the arm 90 degrees, which shortens the deltoid over the cut and changes the section. No measured girth of the abducted arm was read, so the factor is fitted: against the MakeHuman CC0 reference posed to our T-pose by the calibration harness, the girth ratio of our arm to the reference at the `upperArm` ring is on average 0.973 of the same ratio at the forearm's maximum and at the wrist, where posture changes no girth, over the four gate identities (0.93 to 1.00), so the abducted mid upper arm is 1.03 times the hanging one. The reference reaches the T-pose by linear blend skinning from its own rest pose with the arms 45 degrees down, so the factor carries that skinning's error as well as the posture's. Grade: population-fitted to a synthetic reference.
 */
export const AUTOMOVIE_HUMAN_UPPER_ARM_SECTION = {
  front: 1.002,
  back: 1.136,
  medial: 0.957,
  lateral: 0.843,
  abducted: 1.03,
} as const;
