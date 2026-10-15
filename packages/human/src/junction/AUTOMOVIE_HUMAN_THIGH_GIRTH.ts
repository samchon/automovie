/**
 * The thigh's girth curve between its two measured levels, which the `thigh` ring shape and the leg's stations both read so the mid-thigh ring lies on the leg's own curve.
 *
 * The gluteal furrow, where the thigh circumference is measured, lies `furrow` of the hip-to-knee length below the hip joint centre: the 1977 US child survey's furrow heights (Snyder et al. 1977, UM-HSRI-77-17) against ANSUR II's hip and knee centres (Gordon et al. 2014, NATICK/TR-15/007). Grade: derived, from adolescents. Suprapatella, where the lower thigh circumference is measured, lies `suprapatella` of the thigh length above the midpatella, half an adult patella's height and the soft tissue above it. Grade: conventional.
 *
 * Between them the girth is the lower thigh girth plus the share `t^exponent` of its difference to the furrow girth, `t` the level's fraction of the way from suprapatella to the furrow. The exponent is the leg's fit of the MakeHuman CC0 reference's section perimeters at the lower thigh and over vastus medialis (1.0 and 1.3, SD 0.11 and 0.27) over eight people of both sexes, every build, 11, 30 and 80 years, aligned on the skeleton by the shared calibration harness: the thigh slims faster just above the knee than a cone. Grade: population-fitted to a synthetic reference.
 */
export const AUTOMOVIE_HUMAN_THIGH_GIRTH = {
  furrow: 0.21,
  suprapatella: 0.06,
  exponent: 1.15,
} as const;
