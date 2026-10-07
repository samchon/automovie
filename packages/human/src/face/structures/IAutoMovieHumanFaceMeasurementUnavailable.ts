/**
 * A face measurement the current basis cannot read, with the named reason.
 *
 * The reason says what is missing, for example a landmark the basis does not
 * register or a structure it does not model, so the caller sees a gap rather
 * than a default value.
 *
 * @evidence contracts/common.md#principled-implementation An unreadable measurement is reported as a named gap instead of an estimate.
 * @evidence contracts/common.md#clear-and-simple-design One record per gap names the measurement and its reason.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No proxy value stands in for the missing measurement.
 * @evidence contracts/common.md#meaningful-documentation States what the reason names.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A gap names a measurement, not a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels A gap is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A gap emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions A gap carries no value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries A gap builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor shows the gap beside the readings.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A gap carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range A gap bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A gap is output, not input.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMeasurementUnavailable {
  /** Reading kind. */
  status: "unavailable";

  /** Registered measurement name. */
  measurement: string;

  /** What the basis lacks for this measurement. */
  reason: string;
}
