import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";

/**
 * The first second a request draws: its first explicit second, or the start of
 * its sampling.
 */
export function firstAutoMovieInspectorSecond(
  request: IAutoMovieCapturePlanRequest,
): number {
  return request.sampling.kind === "at"
    ? request.sampling.seconds[0]!
    : request.sampling.from;
}
