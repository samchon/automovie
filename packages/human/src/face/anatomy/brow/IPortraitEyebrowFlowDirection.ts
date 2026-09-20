/**
 * One fibre endpoint within the supporting brow and its signed lateral sweep.
 * A tip below its root allows an upper-band hair to converge with lower hairs.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Separates cross-brow hair direction from its skin attachment and geometric cost.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Defines a bounded brow-tip coordinate and signed anatomical lateral displacement.
 */
export interface IPortraitEyebrowFlowDirection {
  /** Tip across the brow: lower boundary zero, upper boundary one. */
  tip: number;
  /** Signed lateral bend in mm; positive points toward the anatomical tail. */
  outwardBend: number;
}
