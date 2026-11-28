import { AutoMovieRenderMedia } from "@automovie/render";
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Keeps each guide pass at its first occurrence and refuses unknown passes.
 * @evidence contracts/development/testing.md#behavioral-verification Calls normalization on a duplicated list, an empty list and an unknown name.
 * @evidence contracts/development/testing.md#independent-expectations The three explicitly ordered distinct outputs detect moving the duplicate, and the empty and unknown cases distinguish omission from refusal.
 */
export function test_render_root_normalize_guide_passes(): void {
  TestValidator.equals(
    "repeats fold",
    AutoMovieRenderMedia.normalizeGuidePasses(["depth", "beauty", "depth", "mask"]),
    ["depth", "beauty", "mask"],
  );
  TestValidator.equals("empty", AutoMovieRenderMedia.normalizeGuidePasses([]), []);
  TestValidator.error("an unknown pass", (): unknown =>
    AutoMovieRenderMedia.normalizeGuidePasses(["sketch"]),
  );
}
