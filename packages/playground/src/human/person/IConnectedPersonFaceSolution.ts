import type { AutoMovieHumanFaceMeasurementReading, IAutoMovieHumanPersonDocument } from "@automovie/human";

/**
 * A solved face measurement target: the person with the solved channel and
 * the stored target, and every face measurement read on it.
 *
 * @author Samchon
 */
export interface IConnectedPersonFaceSolution {
  /** The person with the solved channel weight and the target recorded. */
  document: IAutoMovieHumanPersonDocument;

  /** Every registered face measurement on the solved face. */
  readings: AutoMovieHumanFaceMeasurementReading[];
}
