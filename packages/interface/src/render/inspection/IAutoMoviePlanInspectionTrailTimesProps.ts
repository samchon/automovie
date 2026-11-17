import type { IAutoMovieInspectionRequest } from "./IAutoMovieInspectionRequest.js";

/**
 * A subject-local drawn instant and already parsed trail reach/tick rate. planAutoMovieInspectionTrailTimes samples around seconds on a grid through that instant and clips to the subject duration; the planner validates finite positive duration/reach/ticks and a drawn instant inside the inclusive subject interval.
 *
 * @evidence contracts/development/design.md#principled-representation A subject-local drawn instant and already parsed trail reach/tick rate. planAutoMovieInspectionTrailTimes samples around seconds on a grid through that instant and clips to the subject duration; the planner validates finite positive duration/reach/ticks and a drawn instant inside the inclusive subject interval.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planAutoMovieInspectionTrailTimes exchanges request, seconds, durationSeconds; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A subject-local drawn instant and already parsed trail reach/tick rate. planAutoMovieInspectionTrailTimes samples around seconds on a grid through that instant and clips to the subject duration; the planner validates finite positive duration/reach/ticks and a drawn instant inside the inclusive subject interval.
 * @evidence contracts/development/common.md#meaningful-documentation A subject-local drawn instant and already parsed trail reach/tick rate. planAutoMovieInspectionTrailTimes samples around seconds on a grid through that instant and clips to the subject duration; the planner validates finite positive duration/reach/ticks and a drawn instant inside the inclusive subject interval. The prose and members document how planAutoMovieInspectionTrailTimes interprets and admits these values.
 */
export interface IAutoMoviePlanInspectionTrailTimesProps {
  /** The request's trail window. */
  request: Pick<IAutoMovieInspectionRequest, "reach" | "ticks">;

  /** The drawn film second. */
  seconds: number;

  /** The subject's running time, seconds. */
  durationSeconds: number;
}
