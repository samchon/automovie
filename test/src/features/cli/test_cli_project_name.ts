import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliScaffold } from "automovie";
import * as path from "node:path";

/**
 * The scaffold's project name is a valid npm package name derived from the
 * target directory's basename.
 *
 * Scenarios:
 *
 * 1. An already valid lowercase basename stays unchanged, keeping inner `.`, `_`
 *    and `-`.
 * 2. Uppercase letters, spaces and other characters become lowercase and `-`.
 * 3. A leading `_` or `.` and trailing `-` or `.` are removed.
 * 4. A 300-character basename is cut to npm's 214-character limit.
 * 5. Only the basename counts, and a basename with no valid character falls back
 *    to `automovie-examples`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes preservation of valid name characters, cleanup, the length limit, basename selection and fallback.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the project-name derivation with ordinary, uppercase, punctuated, long and empty-after-cleanup target names. Checks the returned name, including a path whose parent contains invalid characters.
 * @evidence contracts/development/testing.md#independent-expectations Compares hand-written expected names, a 214-character cap applied to a 300-character fixture and the literal `automovie-examples` fallback.
 */
export function test_cli_project_name(): void {
  const cases: readonly (readonly [string, string])[] = [
    ["my-film_2.0", "my-film_2.0"],
    ["My Draft Film!", "my-draft-film"],
    ["_hidden.", "hidden"],
    ["..dots--", "dots"],
    [path.join("Parent Dir", "child"), "child"],
    ["___", "automovie-examples"],
    ["", "automovie-examples"],
  ];
  for (const [basename, expected] of cases)
    TestValidator.equals(
      `name of ${JSON.stringify(basename)}`,
      AutoMovieCliScaffold.deriveProjectName(basename),
      expected,
    );
  TestValidator.equals(
    "npm length limit",
    AutoMovieCliScaffold.deriveProjectName("a".repeat(300)),
    "a".repeat(214),
  );
}
