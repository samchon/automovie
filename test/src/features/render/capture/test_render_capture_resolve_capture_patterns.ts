import { AutoMovieRenderInspectionRequest, AutoMovieRenderCapture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `resolveAutoMovieCapturePatterns` resolves every pattern a request and view
 * carry against the paths a scene holds.
 *
 * Scenarios:
 *
 * 1. The `parts`, `color` and focus patterns resolve in that order; a path
 *    whose ancestor matched too is counted but not listed.
 * 2. A pattern that matches nothing resolves to no path and a count of 0.
 */
export function test_render_capture_resolve_capture_patterns(): void {
  const values: Map<string, string> = new Map<string, string>([
    ["parts", "hero"],
    ["color", "lamp=ff0000"],
    ["label", "ghost"],
  ]);
  const request = AutoMovieRenderInspectionRequest.parseRequest((key: string): string | undefined =>
    values.get(key),
  );
  TestValidator.equals(
    "resolved",
    AutoMovieRenderCapture.resolvePatterns({
      paths: ["hero", "hero/arm", "lamp", "lamp"],
      request,
      view: "front@focus=hero",
    }),
    [
      { role: "parts", pattern: "hero", paths: ["hero"], count: 2 },
      { role: "label", pattern: "ghost", paths: [], count: 0 },
      { role: "color", pattern: "lamp", paths: ["lamp"], count: 1 },
      { role: "focus", pattern: "hero", paths: ["hero"], count: 2 },
    ],
  );
}