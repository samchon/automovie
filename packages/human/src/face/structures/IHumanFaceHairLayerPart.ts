import type { IAutoMovieHumanFaceHair } from "./IAutoMovieHumanFaceHair";

/**
 * Continuous parting field in the connected layer's neutral head frame.
 * The normalized plane, optional Gaussian root envelope and arc decay preserve
 * the existing authored comb convention without a private parting curve.
 *
 * @evidence contracts/common.md#principled-implementation A signed plane, tangent bias and optional Gaussian root envelope express continuous parting without authoring a private curve.
 * @evidence contracts/common.md#clear-and-simple-design Plane side, root envelope and arc decay are one field consumed by evaluateHumanFaceHairDirection and guide-side classification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This type extraction adds no value, fallback, range or geometry branch.
 * @evidence contracts/common.md#meaningful-documentation States normalization, signed metre offset and independent transition, influence and decay meanings.
 * @evidence contracts/modeling.md#spatial-conventions Connected layer lengths remain metres, angles radians and styling weights dimensionless in the neutral head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries existing layer coefficients and creates no independent part identity.
 * @evidence contracts/modeling.md#parameter-channels Plane direction, metric offset and width, relative bias and arc decay retain the existing coupled parting-field definition.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive or new source sample.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The existing scalp attachment and field owners define geometric boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled face and hair consumers own actual output observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no acquired anatomical quantity or physiological inference.
 * @evidenceExclude contracts/anatomy.md#permitted-range The existing layer admission owner retains all bounds.
 * @evidence contracts/anatomy.md#parametric-authority Preserves the connected document's numerical styling field without adding personal strands, curves or a new conversion; this representation establishes no clinical measurement or biological calibration.
 * @author Samchon
 */
export interface IHumanFaceHairLayerPart {
  /** Nonzero plane normal, normalized by the field owner. */
  normal: [number, number, number];

  /** Signed plane offset from the neutral origin, metres. */
  offset: number;

  /** Positive tanh transition width, metres. */
  transitionWidth: number;

  /** Dimensionless direction bias projected into the local tangent. */
  bias: [number, number, number];

  /** Nonnegative relative direction weight. */
  strength: number;

  /** Positive exponential decay distance along the lock, metres. */
  reach: number;

  /** Optional neutral root-space Gaussian envelope. */
  region?: IAutoMovieHumanFaceHair.Region;
}
