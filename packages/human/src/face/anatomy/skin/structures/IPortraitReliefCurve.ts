import { IPortraitReliefCurvePoint } from "./IPortraitReliefCurvePoint";

/**
 * One named curve with at least two controls and a shared surface owner.
 *
 * @author Samchon
 */
export interface IPortraitReliefCurve {
  /** Anatomical responsibility; unique within the layer. */
  name: string;

  /** Ordered controls from the curve root to its terminal attachment. */
  points: readonly IPortraitReliefCurvePoint[];
}
