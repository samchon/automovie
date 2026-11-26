import { AutoMovieRenderCapture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `formatAutoMovieCapturePlanRequest` writes the keys that differ from the
 * absent request.
 *
 * Scenarios:
 *
 * 1. The absent request writes nothing.
 * 2. A request read from values writes them back in the order subject, seconds,
 *    views and inspection keys.
 */
export function test_render_capture_format_capture_plan_request(): void {
  const read = (
    values: [string, string][],
  ): ReturnType<typeof AutoMovieRenderCapture.parsePlanRequest> =>
    AutoMovieRenderCapture.parsePlanRequest(new Map<string, string>(values));
  TestValidator.equals(
    "absent",
    AutoMovieRenderCapture.formatPlanRequest(read([])),
    [],
  );
  const values: [string, string][] = [
    ["subject", "hero"],
    ["at", "1,2.5"],
    ["views", "front;top"],
    ["stroke", "4"],
  ];
  TestValidator.equals(
    "round trip",
    AutoMovieRenderCapture.formatPlanRequest(read(values)),
    values,
  );
}