import { TestValidator } from "@nestia/e2e";
import { deriveAutoMovieProjectName } from "automovie";
import * as path from "node:path";

/**
 * The scaffold's project name is a valid npm package name derived from the
 * target directory's basename.
 *
 * Scenarios:
 *
 * 1. An already valid lowercase basename stays unchanged, keeping inner `.`,
 *    `_` and `-`.
 * 2. Uppercase letters, spaces and other characters become lowercase and `-`.
 * 3. A leading `_` or `.` and trailing `-` or `.` are removed.
 * 4. A 300-character basename is cut to npm's 214-character limit.
 * 5. Only the basename counts, and a basename with no valid character falls
 *    back to `automovie-project`.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `deriveAutoMovieProjectName`, the function `run` uses to name the scaffold, and asserts the returned names, catching an uppercase, leading-underscore, over-long or empty npm name while allowing any valid name to pass unchanged.
 * @evidence contracts/testing.md#independent-expectations Expected names follow npm's published package-name rules for new packages (lowercase, URL-safe, no leading `.` or `_`, at most 214 characters) and the documented fallback, written out by hand rather than computed by the function under test.
 * @evidence contracts/testing.md#distinguishing-cases Covers an input that must stay, inputs that must change in each rule, the 214-character limit with a longer input, a parent directory that must not count, and the empty fallback; publication of the named scaffold belongs to the template package.
 * @evidence contracts/testing.md#execution-ownership A unit test discovered by the `test_` prefix that calls a pure function in-process, touching no filesystem or child process and registering no dynamic cases.
 */
export function test_cli_project_name(): void {
  const cases: readonly (readonly [string, string])[] = [
    ["my-film_2.0", "my-film_2.0"],
    ["My Draft Film!", "my-draft-film"],
    ["_hidden.", "hidden"],
    ["..dots--", "dots"],
    [path.join("Parent Dir", "child"), "child"],
    ["___", "automovie-project"],
    ["", "automovie-project"],
  ];
  for (const [basename, expected] of cases)
    TestValidator.equals(
      `name of ${JSON.stringify(basename)}`,
      deriveAutoMovieProjectName(basename),
      expected,
    );
  TestValidator.equals(
    "npm length limit",
    deriveAutoMovieProjectName("a".repeat(300)),
    "a".repeat(214),
  );
}
