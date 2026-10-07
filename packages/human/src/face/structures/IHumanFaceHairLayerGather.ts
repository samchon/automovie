import type { IHumanFaceHairLayerGatherAnchor } from "./IHumanFaceHairLayerGatherAnchor";
import type { IHumanFaceHairLayerGatherTail } from "./IHumanFaceHairLayerGatherTail";

/**
 * Shared gathering operation of a connected metre/radian hair layer.
 * Angular attachment precedes the free-tail stage on every integrated lock.
 * This is the existing numerical representation, not the degree/mm trait API.
 *
 * @evidence contracts/common.md#principled-implementation Angular attachment, metric tie neighbourhood and attraction strength define the scalp approach separately from the subsequent free-tail stage.
 * @evidence contracts/common.md#clear-and-simple-design The hair builder resolves the anchor, compiles the gather field and passes this same tail stage to each lock.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This type extraction adds no value, fallback, range or geometry branch.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes attachment, metre tie radius, dimensionless attraction and tail ownership.
 * @evidence contracts/modeling.md#spatial-conventions Connected layer lengths remain metres, angles radians and styling weights dimensionless in the neutral head frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries existing layer coefficients and creates no independent part identity.
 * @evidence contracts/modeling.md#parameter-channels Angular attachment, metric neighbourhood and dimensionless strength remain separate existing gather inputs.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive or new source sample.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The existing scalp attachment and field owners define geometric boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled face and hair consumers own actual output observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Adds no acquired anatomical quantity or physiological inference.
 * @evidenceExclude contracts/anatomy.md#permitted-range The existing layer admission owner retains all bounds.
 * @evidence contracts/anatomy.md#parametric-authority Preserves the connected document's numerical styling field without adding personal strands, curves or a new conversion; this representation establishes no clinical measurement or biological calibration.
 * @author Samchon
 */
export interface IHumanFaceHairLayerGather {
  /** Ray attached to the current shared scalp. */
  anchor: IHumanFaceHairLayerGatherAnchor;

  /** Positive tie neighbourhood radius, metres. */
  radius: number;

  /** Attraction relative to the ordinary comb field, in (0,1]. */
  strength: number;

  /** Direction and optional cross-section after entering the tie. */
  tail: IHumanFaceHairLayerGatherTail;
}
