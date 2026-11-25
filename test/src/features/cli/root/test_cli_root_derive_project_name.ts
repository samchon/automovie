import { TestValidator } from "@nestia/e2e";
import { deriveAutoMovieProjectName } from "automovie";

/**
 * `deriveAutoMovieProjectName` lowercases a directory's basename, folds each
 * run outside `a-z 0-9 . _ -` into one `-`, and trims leading `-._` and
 * trailing `-.`; nothing left falls back to the default name.
 *
 * Scenarios:
 *
 * 1. "/work/My Film (2026)" becomes "my-film-2026".
 * 2. "_draft." becomes "draft".
 * 3. A basename of only separators, "---", falls back to the default, which "---"
 *    itself is not.
 */
export function test_cli_root_derive_project_name(): void {
  TestValidator.equals(
    "a spaced title",
    deriveAutoMovieProjectName("/work/My Film (2026)"),
    "my-film-2026",
  );
  TestValidator.equals(
    "trimmed ends",
    deriveAutoMovieProjectName("/work/_draft."),
    "draft",
  );
  const fallback: string = deriveAutoMovieProjectName("/work/---");
  TestValidator.predicate(
    "the default name",
    fallback.length > 0 && fallback !== "---",
  );
}
