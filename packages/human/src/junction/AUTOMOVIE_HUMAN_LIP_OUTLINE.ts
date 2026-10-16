/**
 * Dimensionless shape of the shared upper and lower vermilion courses.
 *
 * Offline equal-weight least squares over the native head-frame mouth curves of the four provided campaign reference heads. The closed quad course passing through each reference rig's upper/lower lip-border seed is split at its two transverse extremes; each arc is normalized by its own half-width and midline-to-corner height and averaged across its two sides. The existing separately sourced crista-philtri span remains fixed. All four leave-one-reference-out fits and eight other held-out native heads improve over the former outline. The two sagittal forward fractions normalize each border's YZ chord from the reference rig's upper/lower inner-lip midpoint. The common transverse depth course is fitted to both native border arcs with equal head weights, normalized by each own mouth-course half-width. These four spatial coefficients accompany the three outline coefficients, so the lips are spatial courses rather than Gaussian ridges. Grade: geometric reference fit, not a clinical landmark certification or population norm. No reference coordinates, indices or topology enter Human.
 */
export const AUTOMOVIE_HUMAN_LIP_OUTLINE: Readonly<{
  /** Cupid-crest rise above the sagittal upper border, over its own height. */
  bowRise: number;

  /** Outer upper-border falloff from the shared crest to commissure. */
  upperExponent: number;

  /** Lower-border outline falloff from midline to commissure. */
  lowerExponent: number;

  /** Anterior fraction of the upper vermilion three-dimensional chord. */
  upperForward: number;

  /** Anterior fraction of the lower vermilion three-dimensional chord. */
  lowerForward: number;

  /** Commissure depth behind the midline oral arch, over mouth half-width. */
  archSag: number;

  /** Transverse shape of the shared oral-arch depth course. */
  archExponent: number;

}> = {
  bowRise: 0.071991,
  upperExponent: 0.951344,
  lowerExponent: 0.561315,
  upperForward: 0.482275,
  lowerForward: 0.148011,
  archSag: 0.420557,
  archExponent: 2.147722,
};
