/**
 * Numerical nasal shape: named nasal measurements and scales, none of which
 * addresses a vertex, curve or patch. Width and opening scales change the
 * shared rim; the same changed vertices seed the surrounding skin blend and
 * the recessed cavity. Lengths are millimetres of the head frame (+X
 * anatomical left, +Y up, +Z anterior), angles are degrees and scales are
 * dimensionless ratios; the neutral of every scale is one and of every
 * displacement is zero.
 *
 * @author Samchon
 */
export interface IPortraitNoseShape {
  /** Width multiplier about the socket midline. */
  widthScale: number;

  /**
   * Optional nasal projection ratio relative to the socket's common skin
   * support plane, positive. Omission or one is identity. Values below one
   * reduce the entire nose's inferred depth, including the samples used by rim
   * fitting, and values above one increase it.
   */
  depthScale?: number;

  /** Tip displacement along host Z, in mm; positive advances the tip. */
  tipProjection: number;

  /** Alar displacement along host Z, in mm; positive advances the alae. */
  alarProjection: number;

  /** Width multiplier in the aperture plane, before overall head-X nasal scaling. */
  nostrilWidthScale: number;

  /** Height multiplier in the aperture plane; preserves its orientation about its centre. */
  nostrilHeightScale: number;

  /** Aperture displacement upwards in host Y, in mm. */
  nostrilRise: number;

  /** Additional rotation around host X, in degrees; positive faces the opening down. */
  nostrilTilt: number;

  /** Inner lining's retained fraction of the fitted rim width/height, in (0,1). */
  cavityContraction: number;

  /** Fraction of cavity travel at the rim support ring; strictly between zero and one. */
  rimSupport: number;

  /** Blend from the measured rim to its fitted smooth ellipse, in [0,1]. */
  rimRoundness: number;

  /** Cavity floor offset in host XYZ millimetres, rotated with the nostril tilt. */
  cavityOffset: number[];

  /** Reach of adjacent skin adaptation along the original mesh, in mm. */
  blendReach: number;
}
