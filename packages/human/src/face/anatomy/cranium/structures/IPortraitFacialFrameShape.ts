/**
 * Craniofacial proportions on named anatomical supports of the fixed
 * landmark basis. They alter the common host before any attached part is built,
 * not a finished eyeball or an unrelated arbitrary displacement field.
 *
 * @evidence contracts/common.md#principled-implementation Each field is one craniofacial trait on a named landmark support of the fixed basis: two global scales with identity one and six local displacements with identity zero, each with a documented positive direction; they alter the host before any part is built.
 * @evidence contracts/common.md#clear-and-simple-design Eight optional numbers with defaults at identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitFacialFrameShape carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States the interval, the identity, the positive direction and the anatomical support of every field.
 * @evidence contracts/modeling.md#parameter-channels Every channel varies one named trait; the two global scales act last (about the nasion), so they also scale the local displacements, an order that the function documents; (transverse or vertical scale, gonial width, gnathion height, pogonion or frontal projection, superior-orbit foundation depth, temporal width), neutral is the identity (one for the scales, zero for the displacements) and each field documents its positive direction. The displacements move both sides equally by their stated rule, so asymmetry is not representable in this type, which is a stated limitation.
 * @evidence contracts/anatomy.md#parametric-authority Every input is a named craniofacial measurement with a unit and an interval on a fixed anatomical support, not a vertex, curve, strand or patch.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres for displacements and dimensionless ratios for scales, stated on the members.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitFacialFrameShape is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitFacialFrameShape decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitFacialFrameShape constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitFacialFrameShape is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @author Samchon
 */
export interface IPortraitFacialFrameShape {
  /** Transverse facial scale about the nasion, in [0.7,1.3]; default 1. */
  widthScale?: number;

  /** Vertical facial scale about the nasion, in [0.7,1.3]; default 1. */
  lengthScale?: number;

  /** Signed lateral mandibular-angle displacement in [-8,8] mm; positive widens. */
  jawWidth?: number;

  /** Gnathion inferior displacement in [-8,8] mm; positive lengthens the chin. */
  chinHeight?: number;

  /** Pogonion anterior displacement in [-8,8] mm; positive advances the chin. */
  chinProjection?: number;

  /** Frontal midline anterior displacement in [-8,8] mm; positive advances the forehead. */
  foreheadProjection?: number;

  /**
   * Superior-orbit foundation depth in [-8,8] mm; positive advances and negative
   * recesses both brow supports before fitting the eyes. Zero preserves the
   * original foundation. The optical aperture stays outside this support.
   */
  browProjection?: number;

  /** Signed lateral temporal displacement in [-8,8] mm; positive widens both temples. */
  templeWidth?: number;
}
