/**
 * A face measurement read on the final surface of one build.
 *
 * `measured` is read on the posed surface rounded to Float32, the precision a
 * static asset carries. `requested` is the document's target for this
 * measurement, or null when the measurement is only reported. A qualified
 * source convention remains that observable quantity; it supplies no value
 * for the unregistered clinical quantity named in its qualification.
 *
 * @evidence contracts/common.md#principled-implementation readHumanFaceMeasurements emits the registry instrument's finite value from the final measurement context, carrying the independently requested target or null and the registry's qualification.
 * @evidence contracts/common.md#clear-and-simple-design The measured discriminator, registry name, unit, request and result remain separate so a target cannot masquerade as an observation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Instrument refusal/nonfinite results become unavailable readings; a qualified source quantity supplies no fabricated clinical measurement or proof of target satisfaction.
 * @evidence contracts/common.md#meaningful-documentation Float32 surface precision, five unit alternatives and nullable requested value identify the observation actually reported.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result record runs no measurement instrument.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registry-order reporting and geometry reuse belong to the reader/context, not this interface.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar readings retain no posed mesh or measurement query.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMeasurementMeasured {
  /** Reading kind. */
  status: "measured";

  /** Registered measurement name. */
  measurement: string;

  /** Unit of both values. */
  unit:
    | "millimetres"
    | "square-millimetres"
    | "degrees"
    | "cubic-centimetres"
    | "count";

  /** Document target, or null when the measurement is only reported. */
  requested: number | null;

  /** Value read on the final Float32 surface. */
  measured: number;

  /** Source/protocol limitation of this observable value, when supplied by its registry owner. */
  qualification?: string;
}
