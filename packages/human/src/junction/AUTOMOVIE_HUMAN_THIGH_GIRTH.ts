/**
 * The thigh's girth curve between its two measured levels, which the `thigh` ring shape and the leg's stations both read so the mid-thigh ring lies on the leg's own curve and centre.
 *
 * The gluteal furrow, where the thigh circumference is measured, lies `furrow` of the hip-to-knee length below the hip joint centre: the 1977 US child survey's furrow heights (Snyder et al. 1977, UM-HSRI-77-17) against ANSUR II's hip and knee centres (Gordon et al. 2014, NATICK/TR-15/007). Grade: derived, from adolescents. Suprapatella, where the lower thigh circumference is measured, lies `suprapatella` of the thigh length above the midpatella, half an adult patella's height and the soft tissue above it. Grade: conventional.
 *
 * The mid-thigh section is four quarter ellipses about the shared hip-to-knee axis. Their front, back, medial and lateral half axes are dimensionless shape ratios; their common scale is irrelevant because the shared ring normalizes its final periodic cubic limit perimeter to the identity's girth. Back is one to remove that scale ambiguity.
 *
 * The four ratios are our offline least-squares calibration of the twelve-span periodic cubic ring, including its inverse radial stencil and perimeter normalization, against native T-pose sections of the four provided reference meshes used for the campaign's gate correspondence, two of each sex. Each section is halfway between its own hip and knee rig joints, perpendicular to that axis, with projected anterior +Z and the cross product toward medial. Its 144 positive ray distances are divided by its own section perimeter over 2 pi; no reference coordinates, indices or morphs enter this package. Leave-one-reference-out RMS improves in all four cases, and eight other default reference bodies held out from calibration also improve. Grade: population-fitted to synthetic reference shape, not measured human anatomy.
 *
 * This calibrates section shape only. Reference rig centres are geometric correspondence points, not certified clinical joint centres; native posture, stature and girth differ between bodies. The identity's girth, joint centres, canonical stance and heights remain unchanged. ANSUR II thigh circumference uses legs spread until the thighs do not touch and a tape perpendicular to the thigh axis (section 6.4.79), whereas lower thigh uses a horizontal tape with feet about 10 cm apart and relaxed knees (section 6.4.61). Interpolating these onto a single rest stance remains a posture inference, not a proved clinical conversion.
 *
 * Between them the girth is the lower thigh girth plus the share `t^exponent` of its difference to the furrow girth, `t` the level's fraction of the way from suprapatella to the furrow. The exponent is the leg's fit of the MakeHuman CC0 reference's section perimeters at the lower thigh and over vastus medialis (1.0 and 1.3, SD 0.11 and 0.27) over eight people of both sexes, every build, 11, 30 and 80 years, aligned on the skeleton by the shared calibration harness: the thigh slims faster just above the knee than a cone. Grade: population-fitted to a synthetic reference.
 */
export const AUTOMOVIE_HUMAN_THIGH_GIRTH: Readonly<{
  furrow: number;
  suprapatella: number;
  exponent: number;
  section: Readonly<Record<"front" | "back" | "medial" | "lateral", number>>;
}> = {
  furrow: 0.21,
  suprapatella: 0.06,
  exponent: 1.15,
  section: { front: 1.265042, back: 1, medial: 1.103695, lateral: 1.045752 },
};
