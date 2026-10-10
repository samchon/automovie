/**
 * A face measurement read on the final surface of one build.
 *
 * `measured` is read on the posed surface rounded to Float32, the precision a
 * static asset carries. `requested` is the document's target for this
 * measurement, or null when the measurement is only reported. A qualified
 * source convention remains that observable quantity; it supplies no value
 * for the unregistered clinical quantity named in its qualification.
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
