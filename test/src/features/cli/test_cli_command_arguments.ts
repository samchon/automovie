import { TestValidator } from "@nestia/e2e";
import {
  type AutoMovieCommand,
  readAutoMovieCommandArguments,
} from "automovie";

import { throwsError } from "../internal/predicates";

/**
 * CLI admission resolves a whole request before anything is written.
 *
 * Scenarios:
 *
 * 1. No arguments or a lone help flag means help; a lone version flag means
 *    version.
 * 2. `create` keeps its one directory with optional single `--workspace`,
 *    `--force` and `--name <name>` in any order.
 * 3. `add` splits `shorts/<name>` or `series/<name>` into its family and one
 *    directory segment, with optional single `--force` and `--name`.
 * 4. Sync admits one target with optional check and explicit baseline; repeated or missing values refuse.
 * 4a. `capture` keeps every token after it, in order, for the production's request reader, including none.
 * 5. Unknown and removed commands (`start` among them), unknown or repeated
 *    options, a missing `--name` value, missing, extra or blank directories,
 *    an unknown family, an unportable or padded segment, and a standalone flag
 *    beside other tokens all refuse with a message naming the correction.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the exported `readAutoMovieCommandArguments` and asserts the returned request or the thrown message, catching a lost directory, family, `--workspace`, `--force` or `--name`, a path segment that could leave `movies/<family>`, a standalone flag admitted beside other tokens, a removed command accepted, and a refusal that does not say how to correct it.
 * @evidence contracts/development/testing.md#independent-expectations Expected requests and correction fragments come from the CLI grammar in the README and usage text (`create` with `--workspace`, `--name`, `--force`; `add` with `shorts|series/<name>`, `--name`, `--force`; `sync` with single check/baseline options; `capture` whose options the production's request grammar reads; standalone `-h`/`--help` and `-v`/`--version`; `./-name` for a dash-leading directory), not from the parser's output; fragment matching cannot judge the rest of each message's wording.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers empty input, each standalone spelling alone and beside an extra token, every create option together in a shuffled order, both families, zero, blank and two targets, an unknown option per command, a dash-leading directory, repeated flags, `--name` missing, blank or followed by an option, a target without family, with an unknown family or an extra segment, empty, `..`, separator-bearing and padded segments, and the removed `start`, `toc` and `inspect-external` commands; execution of an admitted request belongs to `run` and the project name to `test_cli_project_name`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test discovered by the `test_` prefix that calls the pure parser in-process with literal argument arrays, starting no process and registering no dynamic cases.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states the behavior under test and lists each scenario with the property it pins.
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
  TestValidator.equals(
    "create a single production",
    read("create", "project"),
    {
      command: "create",
      directory: "project",
      workspace: false,
      force: false,
    },
  );
  TestValidator.equals(
    "create a workspace with every option in any order",
    read("create", "--name", "studio", ".", "--force", "--workspace"),
    {
      command: "create",
      directory: ".",
      workspace: true,
      force: true,
      name: "studio",
    },
  );
  TestValidator.equals("add a short", read("add", "shorts/kickboxing"), {
    command: "add",
    family: "shorts",
    directory: "kickboxing",
    force: false,
  });
  TestValidator.equals(
    "add a series with a package name and force",
    read("add", "--force", "series/napoleon", "--name", "napoleon-imperator"),
    {
      command: "add",
      family: "series",
      directory: "napoleon",
      force: true,
      name: "napoleon-imperator",
    },
  );
  TestValidator.equals("sync has an explicit target", read("sync", "movie"), {
    command: "sync",
    directory: "movie",
    check: false,
  });
  TestValidator.equals(
    "sync check and declared baseline",
    read("sync", "--check", "movie", "--baseline", "previous"),
    {
      command: "sync",
      directory: "movie",
      check: true,
      baseline: "previous",
    },
  );
  TestValidator.equals(
    "capture keeps its tokens",
    read("capture", "--module", "src/subjects.ts", "--at", "1,2", "--views", "front;top"),
    { command: "capture", args: ["--module", "src/subjects.ts", "--at", "1,2", "--views", "front;top"] },
  );
  TestValidator.equals("capture without tokens", read("capture"), { command: "capture", args: [] });
  // Each refusal names its correction: the one command, the one option, the
  // directory count, a non-blank directory, or a standalone flag.
  const invalid: readonly (readonly [readonly string[], string])[] = [
    [["sync"], "exactly one non-blank target"],
    [["sync", " "], "exactly one non-blank target"],
    [["sync", "one", "two"], "exactly one non-blank target"],
    [["sync", "movie", "--baseline", " "], "needs one non-blank directory"],
    [
      ["sync", "movie", "--baseline", "--check"],
      "needs one non-blank directory",
    ],
    [["sync", "movie", "--force"], "accepts --check and --baseline"],
    [["sync", "movie", "--baseline"], "needs one non-blank directory"],
    [["sync", "movie", "--check", "--check"], "only once"],
    [
      ["sync", "movie", "--baseline", "old", "--baseline", "other"],
      "only once",
    ],
    [["unknown"], "the commands are create, add, sync and capture"],
    [["start", "project"], "the commands are create, add, sync and capture"],
    [["toc"], "the commands are create, add, sync and capture"],
    [
      ["inspect-external", "model.glb", "--profile", "gltf-static-v1"],
      "the commands are create, add, sync and capture",
    ],
    [["create"], "exactly one target directory; received 0"],
    [["create", " "], "non-blank target directory"],
    [["create", "one", "two"], "exactly one target directory; received 2"],
    [["create", "project", "--language", "english"], "accepts --workspace"],
    [["create", "-project"], "./-project"],
    [["create", "project", "--force", "--force"], "only once"],
    [["create", "project", "--workspace", "--workspace"], "only once"],
    [["create", "project", "--name"], "--name needs one non-blank"],
    [["create", "project", "--name", "--force"], "--name needs one non-blank"],
    [["create", "project", "--name", " "], "--name needs one non-blank"],
    [["create", "project", "--name", "a", "--name", "b"], "only once"],
    [["add"], "received 0"],
    [["add", "shorts/a", "series/b"], "received 2"],
    [["add", "kickboxing"], "shorts/<name> or series/<name>"],
    [["add", "features/kickboxing"], "shorts/<name> or series/<name>"],
    [["add", "shorts/a/b"], "shorts/<name> or series/<name>"],
    [["add", "shorts/"], "portable directory name"],
    [["add", "shorts/.."], "portable directory name"],
    [["add", "shorts/a:b"], "portable directory name"],
    [["add", "shorts/ padded"], "without surrounding spaces"],
    [["add", "shorts/a", "--workspace"], "accepts --name and --force"],
    [["add", "shorts/a", "--force", "--force"], "only once"],
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
