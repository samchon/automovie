import { TestValidator } from "@nestia/e2e";
import { type AutoMovieCommand, readAutoMovieCommandArguments } from "automovie";

import { throwsError } from "../internal/predicates";

/**
 * CLI admission resolves a whole request before anything is written.
 *
 * Scenarios:
 *
 * 1. No arguments or a lone help flag means help; a lone version flag means
 *    version.
 * 2. `start` keeps its one directory and an optional single `--force` in any
 *    order.
 * 3. Unknown commands, removed commands and options, missing, extra or blank
 *    directories, a repeated `--force`, and a standalone flag beside other
 *    tokens all refuse with a message naming the correction.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the exported `readAutoMovieCommandArguments` and asserts the returned request or the thrown message, catching a lost directory or `--force`, a standalone flag admitted beside other tokens, a removed command accepted, and a refusal that does not say how to correct it.
 * @evidence contracts/testing.md#independent-expectations Expected requests and correction fragments come from the CLI grammar in the README and usage text (one `start` command, one `--force`, standalone `-h`/`--help` and `-v`/`--version`, `./-name` for a dash-leading directory), not from the parser's output; fragment matching cannot judge the rest of each message's wording.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty input, each standalone spelling alone and beside an extra token, `--force` before and after the directory, zero, blank and two directories, an unknown option and a dash-leading directory, a repeated `--force`, and the removed `toc`, `routes` and `inspect-external` commands; execution of an admitted request belongs to `run` and the project name to `test_cli_project_name`.
 * @evidence contracts/testing.md#execution-ownership A unit test discovered by the `test_` prefix that calls the pure parser in-process with literal argument arrays, starting no process and registering no dynamic cases.
 */
export function test_cli_command_arguments(): void {
  const read = (...args: string[]): AutoMovieCommand =>
    readAutoMovieCommandArguments(args);
  for (const args of [[], ["-h"], ["--help"]] as const)
    TestValidator.equals("standalone help", read(...args), { command: "help" });
  for (const flag of ["-v", "--version"] as const)
    TestValidator.equals("standalone version", read(flag), {
      command: "version",
    });
  TestValidator.equals("start without force", read("start", "project"), {
    command: "start",
    directory: "project",
    force: false,
  });
  TestValidator.equals(
    "force before the directory",
    read("start", "--force", "project"),
    { command: "start", directory: "project", force: true },
  );
  TestValidator.equals(
    "force after the directory",
    read("start", "project", "--force"),
    { command: "start", directory: "project", force: true },
  );
  // Each refusal names its correction: the one command, the one option, the
  // directory count, a non-blank directory, or a standalone flag.
  const invalid: readonly (readonly [readonly string[], string])[] = [
    [["unknown"], "the only command is start"],
    [["toc"], "the only command is start"],
    [["routes", "film"], "the only command is start"],
    [
      ["inspect-external", "model.glb", "--profile", "gltf-static-v1"],
      "the only command is start",
    ],
    [["start"], "exactly one target directory; received 0"],
    [["start", " "], "non-blank target directory"],
    [["start", "one", "two"], "exactly one target directory; received 2"],
    [["start", "project", "--language", "english"], "accepts only --force"],
    [["start", "-project"], "./-project"],
    [["start", "project", "--force", "--force"], "only once"],
    [["--help", "extra"], "--help must be the only argument"],
    [["--version", "extra"], "--version must be the only argument"],
    [["-v", "extra"], "-v must be the only argument"],
  ];
  for (const [args, correction] of invalid)
    TestValidator.predicate(
      `refuses ${JSON.stringify(args)}`,
      throwsError((): AutoMovieCommand => read(...args), correction),
    );
}
