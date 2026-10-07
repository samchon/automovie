/**
 * Numerical free-tail cross-section and its arc-length transition.
 * These metre coefficients shape shared locks without personal strand offsets.
 *
 * @evidence contracts/common.md#principled-implementation Target cross-section radius and transition reach distinguish transverse size from centreline distance along the free tail.
 * @evidence contracts/common.md#clear-and-simple-design createHumanFaceHairTailSpread consumes radius and reach after the tie stage has established the tail frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This type extraction adds no value, fallback, range or geometry branch.
 * @evidence contracts/common.md#meaningful-documentation States nonnegative radius and positive transition reach as separate metre quantities.
 * @evidence contracts/modeling.md#spatial-conventions Connected layer lengths remain metres, angles radians and styling weights dimensionless in the neutral head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries existing layer coefficients and creates no independent part identity.
 * @evidence contracts/modeling.md#parameter-channels Radius and reach retain separate metre-space cross-section and arc-transition meanings.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive or new source sample.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The existing scalp attachment and field owners define geometric boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled face and hair consumers own actual output observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no acquired anatomical quantity or physiological inference.
 * @evidenceExclude contracts/anatomy.md#permitted-range The existing layer admission owner retains all bounds.
 * @evidence contracts/anatomy.md#parametric-authority Preserves the connected document's numerical styling field without adding personal strands, curves or a new conversion; this representation establishes no clinical measurement or biological calibration.
 * @author Samchon
 */
export interface IHumanFaceHairLayerGatherSpread {
  /** Nonnegative target cross-section radius, metres. */
  radius: number;

  /** Positive centreline arc length of the spread transition, metres. */
  reach: number;
}
