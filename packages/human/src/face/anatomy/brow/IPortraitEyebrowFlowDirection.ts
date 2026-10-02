/**
 * One fibre endpoint within the supporting brow and its signed lateral sweep.
 * A tip below its root allows an upper-band hair to converge with lower hairs.
 *
 * The tip is a dimensionless fraction across the brow, and the bend is in
 * head millimetres measured along the eye's own anatomical lateral direction,
 * so one value serves both eyes.
 *
 * @evidence contracts/common.md#principled-implementation Two numbers, where the hair ends across the brow and how far it sweeps sideways, are what the fibre builder reads at each longitudinal witness; the tip is bounded to the brow by its [0,1] fraction and the bend is finite, which is all the endpoint needs.
 * @evidence contracts/common.md#clear-and-simple-design A two-field record with no option, read only by the flow interpolator and the fibre builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A type carries no mechanism and no field names a subject or a fixture.
 * @evidence contracts/common.md#meaningful-documentation Each field states its meaning, the tip's fraction and the bend's sign and unit, and the type states how a tip below its root behaves.
 * @evidence contracts/modeling.md#spatial-conventions The tip is a dimensionless fraction of the local brow width and the bend is in head millimetres with the side-relative sign (positive towards the anatomical tail), so no frame is converted.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type describes one endpoint of a fibre and defines no part or group.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part and displays nothing.
 * @author Samchon
 */
export interface IPortraitEyebrowFlowDirection {
  /** Tip across the brow: lower boundary zero, upper boundary one. */
  tip: number;

  /** Signed lateral bend in mm; positive points toward the anatomical tail. */
  outwardBend: number;
}
