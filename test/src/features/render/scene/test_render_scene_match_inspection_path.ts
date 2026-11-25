import { matchAutoMovieInspectionPath } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `matchAutoMovieInspectionPath` matches an object path against a pattern.
 *
 * A pattern of one name matches that name at any depth and so does everything
 * below it; a pattern of several names is anchored at the root and also covers
 * what lies below; `*` stands for any run of characters inside one name and `**`
 * for any number of whole names.
 *
 * Scenarios:
 *
 * 1. One name matches at any depth, and a name wider than the pattern does not.
 * 2. A multi-name pattern is anchored at the root and covers descendants.
 * 3. `*` matches within a name only, and `**` spans names.
 * 4. An empty pattern is refused, and the empty path matches no name.
 */
export function test_render_scene_match_inspection_path(): void {
  const cases: [string, string, boolean][] = [
    ["hero/arm/hand", "arm", true],
    ["hero/arm/hand", "palm", false],
    ["hero/arm", "hero/arm", true],
    ["hero/arm/hand", "hero/arm", true],
    ["hero", "hero/arm", false],
    ["lamp/hero/arm", "hero/arm", false],
    ["hero1/x", "hero*", true],
    ["ahero/x", "hero*", false],
    ["a/b/x", "**/x", true],
    ["a/b/c", "a/*/c", true],
    ["a/b/d/c", "a/*/c", false],
    ["", "a", false],
  ];
  for (const [path, pattern, expected] of cases)
    TestValidator.equals(
      `${path} ~ ${pattern}`,
      matchAutoMovieInspectionPath(path, pattern),
      expected,
    );
  TestValidator.error("empty pattern", (): void => {
    matchAutoMovieInspectionPath("a", "");
  });
}