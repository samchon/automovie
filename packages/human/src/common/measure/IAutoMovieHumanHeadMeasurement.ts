import type { IAutoMovieHumanHeadBreadthMeasurement } from "./IAutoMovieHumanHeadBreadthMeasurement";
import type { IAutoMovieHumanHeadCircumferenceMeasurement } from "./IAutoMovieHumanHeadCircumferenceMeasurement";
import type { IAutoMovieHumanHeadLengthMeasurement } from "./IAutoMovieHumanHeadLengthMeasurement";
import type { IAutoMovieHumanLandmarkDistanceMeasurement } from "./IAutoMovieHumanLandmarkDistanceMeasurement";
import type { IAutoMovieHumanTragionTopMeasurement } from "./IAutoMovieHumanTragionTopMeasurement";

/**
 * A head measurement rule the person evaluates on the head view of its skin at
 * rest (`HUMAN_HEAD_MEASUREMENTS`).
 *
 * @author Samchon
 */
export type IAutoMovieHumanHeadMeasurement =
  | IAutoMovieHumanTragionTopMeasurement
  | IAutoMovieHumanHeadLengthMeasurement
  | IAutoMovieHumanHeadBreadthMeasurement
  | IAutoMovieHumanLandmarkDistanceMeasurement
  | IAutoMovieHumanHeadCircumferenceMeasurement;
