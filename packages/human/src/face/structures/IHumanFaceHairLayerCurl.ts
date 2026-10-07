/**
 * Existing metre/radian wave or helix field of a connected numerical hair layer.
 * Contact may change the realised path; this is not stress-free rod mechanics.
 *
 * @evidence contracts/common.md#principled-implementation Mode distinguishes planar and rotating modulation while angle, wavelength and onset reach keep direction amplitude separate from its arc-length scales.
 * @evidence contracts/common.md#clear-and-simple-design evaluateHumanFaceHairDirection reads this one modulation record after the base comb and lift fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This type extraction adds no value, fallback, range or geometry branch.
 * @evidence contracts/common.md#meaningful-documentation States radian deflection and two positive metre scales, and distinguishes realised contact paths from rod mechanics.
 * @evidence contracts/modeling.md#spatial-conventions Connected layer lengths remain metres, angles radians and styling weights dimensionless in the neutral head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries existing layer coefficients and creates no independent part identity.
 * @evidence contracts/modeling.md#parameter-channels Mode, radian angle, metre wavelength and onset reach retain the existing wave or helix direction modulation.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive or new source sample.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The existing scalp attachment and field owners define geometric boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled face and hair consumers own actual output observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no acquired anatomical quantity or physiological inference.
 * @evidenceExclude contracts/anatomy.md#permitted-range The existing layer admission owner retains all bounds.
 * @evidence contracts/anatomy.md#parametric-authority Preserves the connected document's numerical styling field without adding personal strands, curves or a new conversion; this representation establishes no clinical measurement or biological calibration.
 * @author Samchon
 */
export interface IHumanFaceHairLayerCurl {
  /** Planar wave or rotating direction modulation. */
  mode: "wave" | "helix";

  /** Maximum deflection in [0,pi/2) radians. */
  angle: number;

  /** Positive centreline wavelength, metres, with eight integration intervals. */
  wavelength: number;

  /** Positive exponential onset distance, metres. */
  reach: number;
}
