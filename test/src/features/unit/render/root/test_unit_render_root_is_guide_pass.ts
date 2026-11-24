import { AUTOMOVIE_GUIDE_PASSES, isGuidePass } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `isGuidePass` admits exactly the closed list of guide passes.
 *
 * Scenarios:
 *
 * 1. Every listed pass, "beauty" through "graphics", is admitted.
 * 2. "sketch" and "" are not.
 */
export function test_unit_render_root_is_guide_pass(): void {
  TestValidator.equals(
    "the closed list",
    [...AUTOMOVIE_GUIDE_PASSES].filter(isGuidePass),
    ["beauty", "depth", "mask", "normal", "outline", "pose", "albedo", "graphics"],
  );
  TestValidator.equals("other names", ["sketch", ""].map(isGuidePass), [
    false,
    false,
  ]);
}