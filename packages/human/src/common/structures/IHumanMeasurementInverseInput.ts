/**
 * One bounded, one-dimensional measurement inverse: the channel weight range,
 * the existing weight, the metric target and the caller's reader.
 *
 * @evidence contracts/common.md#principled-implementation The inverse needs exactly the bracket, the existing weight, the target and the forward reading of the same instrument.
 * @evidence contracts/common.md#clear-and-simple-design Five fields; the instrument stays with the caller through `read`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No channel, person or measurement identity enters beyond the label used in refusals.
 * @evidence contracts/common.md#meaningful-documentation States each field's unit and owner.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record names no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The caller owns the channel; only its weight range enters.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Target and readings are metres; the weight is the caller's dimensionless channel weight.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The record owns nothing a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The caller's measurement rule defines the instrument.
 * @evidenceExclude contracts/anatomy.md#permitted-range The inverse admits the target against the reach of `range`.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The record is the inverse's input, not a document field.
 * @author Samchon
 */
export interface IHumanMeasurementInverseInput {
  /** Finite ordered channel weight range containing `current`. */
  range: [number, number];

  /** Existing channel weight, returned unchanged when the target already reads equal. */
  current: number;

  /** Requested reading, in metres. */
  targetMetres: number;

  /**
   * The caller's reading at one weight, in metres.
   *
   * @evidence contracts/common.md#principled-implementation The forward reading of the same instrument the target names.
   * @evidence contracts/common.md#clear-and-simple-design One scalar reading per weight.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A non-finite reading refuses in the inverse.
   * @evidence contracts/common.md#meaningful-documentation States the unit and owner.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The callback defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The callback is not a shaping channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The callback emits no geometry.
   * @evidence contracts/modeling.md#spatial-conventions Metres.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The callback builds no boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The callback owns nothing a viewer displays.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The registered measurement or caller states the protocol.
   * @evidenceExclude contracts/anatomy.md#permitted-range The callback admits no value.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The callback is a reader, not a caller input.
   */
  read: (weight: number) => number;

  /** Measurement name stated in refusals. */
  label: string;
}
