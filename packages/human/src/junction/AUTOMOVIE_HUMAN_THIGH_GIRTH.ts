/**
 * The thigh's girth curve between its two measured levels, which the `thigh` ring shape and the leg's stations both read so the mid-thigh ring lies on the leg's own curve and centre.
 *
 * The gluteal furrow, where the thigh circumference is measured, lies `furrow` of the hip-to-knee length below the hip joint centre: the 1977 US child survey's furrow heights (Snyder et al. 1977, UM-HSRI-77-17) against ANSUR II's hip and knee centres (Gordon et al. 2014, NATICK/TR-15/007). Grade: derived, from adolescents. Suprapatella, where the lower thigh circumference is measured, lies `suprapatella` of the thigh length above the midpatella, half an adult patella's height and the soft tissue above it. Grade: conventional.
 *
 * The mid-thigh section is four quarter ellipses about the hip-to-knee axis, their half axes toward the front, back, medial and lateral sides in `section` as fractions of the section's mean radius, the ring then scaled so its limit girth is the girth there: broad and deep in front over the quadriceps and medially over the adductors, flat behind and flattest laterally under the iliotibial band. Our least-squares fit of the MakeHuman CC0 reference's section 2 mm below the `thigh` ring plane, its rays from the axis divided by the section's own mean radius and averaged over the four lean 20-year-old gate identities of the calibration harness (a slim model woman and man, a lean muscular woman and man); RMS residual 0.036 mean radii against 0.22 for a circle about the axis. Grade: population-fitted to a synthetic reference.
 *
 * Between them the girth is the lower thigh girth plus the share `t^exponent` of its difference to the furrow girth, `t` the level's fraction of the way from suprapatella to the furrow. The exponent is the leg's fit of the MakeHuman CC0 reference's section perimeters at the lower thigh and over vastus medialis (1.0 and 1.3, SD 0.11 and 0.27) over eight people of both sexes, every build, 11, 30 and 80 years, aligned on the skeleton by the shared calibration harness: the thigh slims faster just above the knee than a cone. Grade: population-fitted to a synthetic reference.
 */
export const AUTOMOVIE_HUMAN_THIGH_GIRTH = {
  furrow: 0.21,
  suprapatella: 0.06,
  exponent: 1.15,
  section: { front: 1.352, back: 0.762, medial: 1.106, lateral: 0.731 },
} as const;
