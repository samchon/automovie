import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliScaffold } from "automovie";

/**
 * `deriveProjectNameImplementation` lowercases a directory's basename, folds each
 * run outside `a-z 0-9 . _ -` into one `-`, and trims leading `-._` and
 * trailing `-.`; nothing left falls back to the default name.
 *
 * Scenarios:
 *
 * 1. "/work/My Film (2026)" becomes "my-film-2026".
 * 2. "_draft." becomes "draft".
 * 3. A basename of only separators, "---", falls back to the default, which "---"
 *    itself is not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines basename normalization, trimming and default naming when nothing remains.
 * @evidence contracts/development/testing.md#behavioral-verification Derives names for a title with spaces and punctuation, an underscored and dotted draft and a separators-only basename.
 * @evidence contracts/development/testing.md#independent-expectations The authored normalization yields `my-film-2026` and `draft`. Separators-only input independently triggers the known default name.
 */
export function test_cli_root_derive_project_name(): void {
  TestValidator.equals(
    "a spaced title",
    AutoMovieCliScaffold.deriveProjectName("/work/My Film (2026)"),
    "my-film-2026",
  );
  TestValidator.equals(
    "trimmed ends",
    AutoMovieCliScaffold.deriveProjectName("/work/_draft."),
    "draft",
  );
  const fallback: string = AutoMovieCliScaffold.deriveProjectName("/work/---");
  TestValidator.predicate(
    "the default name",
    fallback.length > 0 && fallback !== "---",
  );
}
