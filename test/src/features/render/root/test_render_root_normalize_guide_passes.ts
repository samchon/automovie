import { normalizeGuidePasses } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `normalizeGuidePasses` keeps each known pass at its first position, folding
 * repeats, and refuses an unknown name.
 *
 * Scenarios:
 *
 * 1. ["depth", "beauty", "depth", "mask"] folds to ["depth", "beauty", "mask"].
 * 2. The empty list stays empty.
 * 3. "sketch" is refused.
 */
export function test_render_root_normalize_guide_passes(): void {
  TestValidator.equals(
    "repeats fold",
    normalizeGuidePasses(["depth", "beauty", "depth", "mask"]),
    ["depth", "beauty", "mask"],
  );
  TestValidator.equals("empty", normalizeGuidePasses([]), []);
  TestValidator.error("an unknown pass", (): unknown =>
    normalizeGuidePasses(["sketch"]),
  );
}
