import { AutoMovieRenderMedia } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `isGuidePass` admits exactly the closed list of guide passes.
 *
 * Scenarios:
 *
 * 1. Every listed pass, "beauty" through "graphics", is admitted.
 * 2. "sketch" and "" are not.
 */
export function test_render_root_is_guide_pass(): void {
  TestValidator.equals(
    "the closed list",
    [...AutoMovieRenderMedia.guidePasses()].filter(AutoMovieRenderMedia.isGuidePass),
    [
      "beauty",
      "depth",
      "mask",
      "normal",
      "outline",
      "pose",
      "albedo",
      "graphics",
    ],
  );
  TestValidator.equals("other names", ["sketch", ""].map(AutoMovieRenderMedia.isGuidePass), [
    false,
    false,
  ]);
}
