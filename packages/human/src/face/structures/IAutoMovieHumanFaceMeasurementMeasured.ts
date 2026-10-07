/**
 * A face measurement read on the final surface of one build.
 *
 * `measured` is read on the posed surface rounded to Float32, the precision a
 * static asset carries. `requested` is the document's target for this
 * measurement, or null when the measurement is only reported. A qualified
 * source convention remains that observable quantity; it supplies no value
 * for the unregistered clinical quantity named in its qualification.
 *
 * @evidence contracts/common.md#principled-implementation Requested and measured values come from the same final surface, so their difference is the real residual.
 * @evidence contracts/common.md#clear-and-simple-design One record per reading names the measurement, its unit and both values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reading is never replaced by the requested value.
 * @evidence contracts/common.md#meaningful-documentation States the precision of the reading and the meaning of a null request.
 * @evidence contracts/modeling.md#spatial-conventions Values are millimetres, square millimetres, degrees or cubic centimetres as the unit field states.
 * @evidence contracts/modeling.md#rendered-observation The reading measures the same surface the editor displays and exports.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A reading names a measurement, not a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels A reading is not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry A reading emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries A reading builds no boundary.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The registered measurement states its protocol.
 * @evidenceExclude contracts/anatomy.md#permitted-range A reading bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority A reading is output, not input.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMeasurementMeasured {
  /** Reading kind. */
  status: "measured";

  /** Registered measurement name. */
  measurement: string;

  /** Unit of both values. */
  unit: "millimetres" | "square-millimetres" | "degrees" | "cubic-centimetres" | "count";

  /** Document target, or null when the measurement is only reported. */
  requested: number | null;

  /** Value read on the final Float32 surface. */
  measured: number;

  /** Source/protocol limitation of this observable value, when supplied by its registry owner. */
  qualification?: string;
}
