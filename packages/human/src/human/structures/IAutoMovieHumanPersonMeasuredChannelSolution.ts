import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonMeasurementReading } from "./IAutoMovieHumanPersonMeasurementReading";

/**
 * A solved person measurement: the new document, the reading of its final
 * Float32 skin, and whether the target lies within the population the
 * measurement's source observed.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonMeasuredChannelSolution {
  /** The person with the solved body channel; everything else unchanged. */
  document: IAutoMovieHumanPersonDocument;

  /** The reading of the solved person's final Float32 skin. */
  reading: IAutoMovieHumanPersonMeasurementReading;

  /** Whether the target lies within the range the measurement's source sample observed. */
  population: "within-source-sample" | "outside-source-sample";
}
