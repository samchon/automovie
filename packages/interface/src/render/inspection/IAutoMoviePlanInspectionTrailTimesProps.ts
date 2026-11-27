import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest.js";

/**
 * A subject-local drawn instant and already parsed trail reach/tick rate.
 * AutoMovieRenderInspection.planTrailTimes samples around seconds on a grid through
 * that instant and clips to the subject duration; the planner validates finite
 * positive duration/reach/ticks and a drawn instant inside the inclusive
 * subject interval.
 */
export interface IAutoMoviePlanInspectionTrailTimesProps {
  /** The request's trail window. */
  request: Pick<IAutoMovieInspectionRequest, "reach" | "ticks">;

  /** The drawn film second. */
  seconds: number;

  /** The subject's running time, seconds. */
  durationSeconds: number;
}
