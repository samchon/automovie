import { IPortraitReliefCurvePoint } from "./IPortraitReliefCurvePoint";

/**
 * One named curve with at least two controls and a shared surface owner.
 *
 * @evidence contracts/common.md#principled-implementation A curve is a unique name and an ordered list of at least two controls from root to terminal attachment, which is what the curve layer samples into overlapping fields.
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitReliefCurve carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States the anatomical responsibility of the name, the uniqueness and the ordering of the controls.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitReliefCurve is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitReliefCurve carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitReliefCurve decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitReliefCurve constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitReliefCurve is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @evidenceExclude contracts/modeling.md#spatial-conventions IPortraitReliefCurve states no unit or frame beyond what its members document.
 * @author Samchon
 */
export interface IPortraitReliefCurve {
  /** Anatomical responsibility; unique within the layer. */
  name: string;

  /** Ordered controls from the curve root to its terminal attachment. */
  points: readonly IPortraitReliefCurvePoint[];
}
