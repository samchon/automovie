/**
 * The weight a measurement inverse selected and the reading it gives.
 *
 * @evidence contracts/common.md#principled-implementation The returned reading is the caller's own reading at the returned weight, so the residual is real.
 * @evidence contracts/common.md#clear-and-simple-design Two fields: the weight and its reading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reading is never replaced by the target.
 * @evidence contracts/common.md#meaningful-documentation States each field's unit.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The caller stores the weight on its channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions The reading is metres; the weight is dimensionless.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record owns nothing a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The caller's measurement rule defines the instrument.
 * @evidenceExclude contracts/anatomy.md#permitted-range The weight lies inside the caller's range by construction.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is output, not input.
 * @author Samchon
 */
export interface IHumanMeasurementInverseResult {
  /** Selected channel weight. */
  weight: number;

  /** The caller's reading at `weight`, in metres. */
  actualMetres: number;
}
