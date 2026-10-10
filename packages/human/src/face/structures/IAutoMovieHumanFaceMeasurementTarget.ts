/**
 * One requested value of a registered face measurement.
 *
 * `measurement` names a measurement the face resolver registers (for example
 * `fissureWidth`); `value` is in that measurement's declared unit,
 * such as millimetres, square millimetres, degrees, volume or count. The editor solves the target onto the existing
 * channels the measurement lists and stores the solved weights beside it, so
 * a saved document replays without solving; the builder re-reads the final
 * surface and reports requested against measured. An unregistered name is
 * refused by name.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceMeasurementTarget {
  /** Registered measurement name. */
  measurement: string;

  /** Requested value in the measurement's declared unit. */
  value: number;
}
