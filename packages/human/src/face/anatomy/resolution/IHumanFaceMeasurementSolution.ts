/**
 * The channel weight a face measurement target solved to and the value it
 * reads.
 *
 * @evidence contracts/common.md#principled-implementation The measured value is the real reading at the returned weight.
 * @evidence contracts/common.md#clear-and-simple-design Channel, weight and reading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reading is never replaced by the target.
 * @evidence contracts/common.md#meaningful-documentation States each field.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record names no part.
 * @evidence contracts/modeling.md#parameter-channels The channel is an existing basis channel and the weight lies in its envelope.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions The reading is in the measurement's unit.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor shows the reading.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The measurement states its protocol.
 * @evidenceExclude contracts/anatomy.md#permitted-range The weight lies in the channel's envelope by construction.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is output, not input.
 * @author Samchon
 */
export interface IHumanFaceMeasurementSolution {
  /** The channel whose weight was solved. */
  channel: string;

  /** The solved weight, inside the channel's envelope. */
  weight: number;

  /** The reading at that weight, in the measurement's unit. */
  measured: number;
}
