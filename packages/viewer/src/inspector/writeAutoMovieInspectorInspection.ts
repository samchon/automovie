import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import { AutoMovieRenderInspectionRequest } from "@automovie/render";

/**
 * A request's inspection as the text it writes: the identity by which the
 * inspector reuses an applied inspection instead of applying it again.
 */
export function writeAutoMovieInspectorInspection(
  request: Pick<IAutoMovieCapturePlanRequest, "inspection">,
): string {
  return JSON.stringify(AutoMovieRenderInspectionRequest.formatRequest(request.inspection));
}
