/**
 * A face measurement the current basis cannot read, with the named reason.
 *
 * The reason says what is missing, for example a landmark the basis does not
 * register or a structure it does not model, so the caller sees a gap rather
 * than a default value.
 *
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
