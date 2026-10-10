import type { IAutoMovieHumanFaceMeasurementMeasured } from "./IAutoMovieHumanFaceMeasurementMeasured";
import type { IAutoMovieHumanFaceMeasurementUnavailable } from "./IAutoMovieHumanFaceMeasurementUnavailable";

/**
 * One build's reading of a registered face measurement: a value on the final
 * surface, or a named gap.
 *
 * @author Samchon
 */
export type AutoMovieHumanFaceMeasurementReading =
  | IAutoMovieHumanFaceMeasurementMeasured
  | IAutoMovieHumanFaceMeasurementUnavailable;
