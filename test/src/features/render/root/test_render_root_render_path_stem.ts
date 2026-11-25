import { renderPathStem } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `renderPathStem` maps a target to one safe path component: runs outside
 * `A-Za-z0-9_.-` become one `_`, trailing dots go, an empty result is "render",
 * and a Windows device name (any extension) gains a leading `_`.
 *
 * Scenarios:
 *
 * 1. "shot 01/take" becomes "shot_01_take".
 * 2. "final..." becomes "final"; "", "." and ".." become "render"; "a/../b" stays
 *    one component, "a_.._b".
 * 3. "con" and "NUL.mp4" become "_con" and "_NUL.mp4"; "console" is kept.
 */
export function test_render_root_render_path_stem(): void {
  TestValidator.equals(
    "separators",
    renderPathStem("shot 01/take"),
    "shot_01_take",
  );
  TestValidator.equals("trailing dots", renderPathStem("final..."), "final");
  TestValidator.equals("empty", renderPathStem(""), "render");
  TestValidator.equals("dot", renderPathStem("."), "render");
  TestValidator.equals("inner dots", renderPathStem("a/../b"), "a_.._b");
  TestValidator.equals("dot dot", renderPathStem(".."), "render");
  TestValidator.equals("con", renderPathStem("con"), "_con");
  TestValidator.equals("NUL.mp4", renderPathStem("NUL.mp4"), "_NUL.mp4");
  TestValidator.equals("console", renderPathStem("console"), "console");
}
