import { TestValidator } from "@nestia/e2e";
import {
  type AutoMovieCommand,
  readAutoMovieCommandArguments,
} from "automovie";

import { throwsError } from "../../../internal/predicates";

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
 * 4. `capture`, `render` and `review` keep every token after them, in order, for the production's option reader, including none.
 * 5. Unknown and removed commands (`start` and `sync` among them), unknown or repeated
 *    options, a missing `--name` value, missing, extra or blank directories,
 *    an unknown family, an unportable or padded segment, and a standalone flag
 *    beside other tokens all refuse with a message naming the correction.
 */
export function test_unit_cli_cli_command_arguments(): void {
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
  TestValidator.equals(
    "capture keeps its tokens",
    read(
      "capture",
      "--module",
      "src/subjects.ts",
      "--at",
      "1,2",
      "--views",
      "front;top",
    ),
    {
      command: "capture",
      args: [
        "--module",
        "src/subjects.ts",
        "--at",
        "1,2",
        "--views",
        "front;top",
      ],
    },
  );
  TestValidator.equals("capture without tokens", read("capture"), {
    command: "capture",
    args: [],
  });
  TestValidator.equals(
    "render and review keep their tokens",
    [
      read("render", "--module", "src/subjects.ts"),
      read("review", "--url", "http://127.0.0.1:5173/", "--seconds", "5"),
    ],
    [
      { command: "render", args: ["--module", "src/subjects.ts"] },
      {
        command: "review",
        args: ["--url", "http://127.0.0.1:5173/", "--seconds", "5"],
      },
    ],
  );
  // Each refusal names its correction: the one command, the one option, the
  // directory count, a non-blank directory, or a standalone flag.
  const invalid: readonly (readonly [readonly string[], string])[] = [
    [
      ["unknown"],
      "the commands are create, add, capture, inspect, render and review",
    ],
    [
      ["start", "project"],
      "the commands are create, add, capture, inspect, render and review",
    ],
    [
      ["sync", "movie"],
      "the commands are create, add, capture, inspect, render and review",
    ],
    [
      ["inspect-external", "model.glb", "--profile", "gltf-static-v1"],
      "the commands are create, add, capture, inspect, render and review",
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
