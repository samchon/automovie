/**
 * One requested value of a registered face measurement.
 *
 * `measurement` names a measurement the face resolver registers (for example
 * `fissureWidth`); `value` is in that measurement's declared unit,
 * millimetres or degrees. The editor solves the target onto the existing
 * channels the measurement lists and stores the solved weights beside it, so
 * a saved document replays without solving; the builder re-reads the final
 * surface and reports requested against measured. An unregistered name is
 * refused by name.
 *
 * @evidence contracts/common.md#principled-implementation A target is a named measurement on the final surface, solved onto existing channels, never a vertex edit.
 * @evidence contracts/common.md#clear-and-simple-design Two fields name the measurement and its requested value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default or population mean is substituted for an absent target; an unknown measurement refuses.
 * @evidence contracts/common.md#meaningful-documentation States the unit owner, the solve-and-store flow and the refusal.
 * @evidence contracts/modeling.md#parameter-channels The target is an anatomical input solved onto named channels the measurement declares.
 * @evidence contracts/modeling.md#spatial-conventions The value is millimetres or degrees as the registered measurement declares.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A target names a measurement, not a part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A target emits no geometry; the channels it solves do.
 * @evidenceExclude contracts/modeling.md#shared-boundaries A target builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor and builder observe the solved shape.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The registered measurement states its protocol and source.
 * @evidenceExclude contracts/anatomy.md#permitted-range The solved channel's admitted range bounds the target; unreachable targets refuse.
 * @evidence contracts/anatomy.md#parametric-authority The input is a named anatomical measurement, never a vertex or curve.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMeasurementTarget {
  /** Registered measurement name. */
  measurement: string;

  /** Requested value in the measurement's declared unit. */
  value: number;
}
