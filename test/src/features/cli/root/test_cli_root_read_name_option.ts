import { TestValidator } from "@nestia/e2e";
import { AutoMovieCliScaffold } from "automovie";

/**
 * Create and add preserve a supplied package name exactly after admitting it.
 *
 * Scenarios:
 *
 * 1. Ordinary and surrounding-spaced names are returned as typed.
 * 2. A missing token, a blank token and an option token refuse.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines exact preservation of a supplied create or add package name after CLI option admission.
 * @evidence contracts/development/testing.md#behavioral-verification Reads ordinary and surrounding-spaced create input and ordinary add input, then tries missing, blank and option-valued names.
 * @evidence contracts/development/testing.md#independent-expectations The supplied name text keeps its spaces. The invalid tokens contain no usable name, so each must produce a refusal.
 */
export function test_cli_root_read_name_option(): void {
  TestValidator.equals(
    "an ordinary create name",
    AutoMovieCliScaffold.readCreateArguments(["project", "--name", "my-film"]),
    {
      command: "create",
      directory: "project",
      workspace: false,
      force: false,
      name: "my-film",
    },
  );
  TestValidator.equals(
    "a create name with surrounding spaces stays as typed",
    AutoMovieCliScaffold.readCreateArguments([
      "project",
      "--name",
      " my-film ",
    ]),
    {
      command: "create",
      directory: "project",
      workspace: false,
      force: false,
      name: " my-film ",
    },
  );
  TestValidator.equals(
    "an add name is admitted",
    AutoMovieCliScaffold.readAddArguments([
      "shorts/my-film",
      "--name",
      "my-film",
    ]),
    {
      command: "add",
      family: "shorts",
      directory: "my-film",
      force: false,
      name: "my-film",
    },
  );
  const invalid: readonly (readonly [string, readonly string[]])[] = [
    ["missing", ["project", "--name"]],
    ["blank", ["project", "--name", "   "]],
    ["option token", ["project", "--name", "--force"]],
  ];
  for (const [label, args] of invalid)
    TestValidator.error(label, (): unknown =>
      AutoMovieCliScaffold.readCreateArguments(args),
    );
}
