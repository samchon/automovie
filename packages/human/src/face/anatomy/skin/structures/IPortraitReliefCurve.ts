import { IPortraitReliefCurvePoint } from "./IPortraitReliefCurvePoint";

/**
 * One named curve with at least two controls and a shared surface owner.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Groups a continuous anatomical relief path under one surface owner.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Names an ordered sequence of at least two bound controls from root to terminal attachment.
 * @author Samchon
 */
export interface IPortraitReliefCurve {
  /** Anatomical responsibility; unique within the layer. */
  name: string;

  /** Ordered controls from the curve root to its terminal attachment. */
  points: readonly IPortraitReliefCurvePoint[];
}
