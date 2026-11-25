import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import { formatAutoMovieInspectionRequest } from "@automovie/render";

/**
 * A request's inspection as the text it writes: the identity by which the
 * inspector reuses an applied inspection instead of applying it again.
 */
export function writeAutoMovieInspectorInspection(
  request: Pick<IAutoMovieCapturePlanRequest, "inspection">,
): string {
  return JSON.stringify(formatAutoMovieInspectionRequest(request.inspection));
}
