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
 *    tokens all refuse.
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
  const invalid: readonly (readonly string[])[] = [
    ["unknown"],
    ["toc"],
    ["routes", "film"],
    ["inspect-external", "model.glb", "--profile", "gltf-static-v1"],
    ["start"],
    ["start", " "],
    ["start", "one", "two"],
    ["start", "project", "--language", "english"],
    ["start", "project", "--force", "--force"],
    ["--help", "extra"],
    ["--version", "extra"],
  ];
  for (const args of invalid)
    TestValidator.predicate(
      `refuses ${JSON.stringify(args)}`,
      throwsError((): AutoMovieCommand => read(...args)),
    );
}
