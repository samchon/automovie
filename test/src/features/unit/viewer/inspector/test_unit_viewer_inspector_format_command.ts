import {
  formatAutoMovieInspectorCommand,
  readAutoMovieInspectorAddress,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `formatAutoMovieInspectorCommand` writes a request as `automovie capture`
 * options, single-quoting an argument a shell would split.
 *
 * Scenarios:
 *
 * 1. "at=1" is the option "--at=1" and the text "automovie capture --at=1".
 * 2. A subject "a b's" is quoted as '--subject=a b'''s'.
 */
export function test_unit_viewer_inspector_format_command(): void {
  TestValidator.equals(
    "a plain option",
    formatAutoMovieInspectorCommand(readAutoMovieInspectorAddress("at=1")),
    { options: ["--at=1"], text: "automovie capture --at=1" },
  );
  TestValidator.equals(
    "a quoted option",
    formatAutoMovieInspectorCommand(
      readAutoMovieInspectorAddress(`subject=${encodeURIComponent("a b's")}`),
    ).text,
    "automovie capture '--subject=a b'\\''s'",
  );
}
