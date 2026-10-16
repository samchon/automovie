/**
 * The soft-tissue jawline the neck-top ring follows in front, shared by the head, whose chin ends on it, and the ring.
 *
 * Gnathion, where the chin's contour turns down into its underside, lies `gnathionAboveMenton` face heights above menton and at the depth the measured tragion-gnathion distance leaves: tragion-gnathion over tragion-nasion is 151.7 over 126.7 mm in men and 139.2 over 118.9 in women, adults 20 to 40 (3D Facial Norms; Weinberg et al. 2016, Cleft Palate Craniofac J 53(6):e185-e197), sexes averaged into `gnathionDepth`; derived. From the chin the jawline runs back to each gonion as a superellipse quadrant of exponent `exponent`, fuller than a parabola as the mandible's body is; conventional.
 */
export const AUTOMOVIE_HUMAN_JAWLINE = {
  gnathionDepth: 1.184,
  gnathionAboveMenton: 0.03,
  exponent: 2.2,
} as const;
