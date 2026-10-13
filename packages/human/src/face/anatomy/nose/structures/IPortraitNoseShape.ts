/**
 * Numerical nasal shape: named nasal measurements and scales, none of which addresses a vertex, curve or patch. Width and opening scales change the shared rim; the same changed vertices seed the surrounding skin blend and the recessed cavity. Lengths are millimetres of the head frame (+X anatomical left, +Y up, +Z anterior), angles are degrees and scales are dimensionless ratios; the neutral of every scale is one and of every displacement is zero.
 *
 * @evidence contracts/common.md#principled-implementation Named projection, scale, roundness, aperture tilt and cavity fields control one shared rim/skin/lining construction.
 * @evidence contracts/common.md#clear-and-simple-design The shape exposes scalar traits without personally authored vertex/curve/patch addresses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These authoring values do not reconstruct measured airways, and skin blending does not guarantee fold-free geometry.
 * @evidence contracts/common.md#meaningful-documentation Distances are head millimetres, angles degrees, scales dimensionless; omission of depthScale is identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The nose component owns fitting and attachment work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One shared changed rim supplies neighbouring skin and cavity geometry rather than separate apertures.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller owns the offset array and the resolver copies retained shape data before component lifetime.
 *
 * @author Samchon
 */
export interface IPortraitNoseShape {
  /** Positive width multiplier about the socket midline; one is neutral. */
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

  /** Positive width multiplier in the aperture plane, before overall head-X nasal scaling; one is neutral. */
  nostrilWidthScale: number;

  /** Positive height multiplier in the aperture plane; preserves its orientation about its centre; one is neutral. */
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

  /** Cavity floor offset in host XYZ millimetres, three finite values, rotated with the nostril tilt. */
  cavityOffset: number[];

  /** Nonnegative reach of adjacent skin adaptation along the original mesh, in mm; zero disables the adaptation. */
  blendReach: number;
}
