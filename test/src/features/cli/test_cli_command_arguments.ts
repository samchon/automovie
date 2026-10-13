import { TestValidator } from "@nestia/e2e";
import {
  dispatchAutoMovieCommandArguments,
  readAutoMovieCommandArguments,
} from "automovie";

import { throwsError } from "../internal/predicates";

/**
 *
 * CLI admission consumes a whole request before a dispatcher can act.
 *
 * Scenarios:
 *
 * 1. Supported source commands preserve their explicitly supplied inputs.
 * 2. Missing, repeated, extra, unsupported and retired inputs refuse dispatch.
 * 3. Valid input invokes its dispatcher exactly once and returns its result.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `readAutoMovieCommandArguments` and asserts the whole command object for help, version, `start`, `toc`, `routes` and `inspect-external`, then calls `dispatchAutoMovieCommandArguments` and asserts that every malformed argv throws before the counting dispatcher runs and that a valid argv runs it once and returns its value; it catches a dropped `force` or `check` flag, a last-wins duplicate option, a silently ignored extra token, a retired command still accepted, a blank target directory, and a dispatcher reached by refused input.
 * @evidence contracts/testing.md#independent-expectations Expected objects are written from the documented grammar (lone help or version flag, next-token option values, duplicates refused, no `--` terminator); the four languages, three production kinds and four ingest profiles are spelled out by hand instead of read from the owning packages' constants, so a vocabulary that shrinks fails here. Refusals are checked only as thrown `Error`s, so the correction each message names is not pinned.
 * @evidence contracts/testing.md#distinguishing-cases Positive: no arguments and both help and version spellings, every language, `--force` placed before the directory, `toc` with and without `--check`, every kind and profile. Negative: thirty-one argv arrays covering a help or version flag beside another token, unknown and retired commands (`migrate`, `contracts migrate`, `verify`, `render all`, `sync`), a missing, dangling, flag-valued or unsupported option value, repeated `--language`, `--force`, `--check` and `--profile`, unknown options, two positionals and a blank directory. What `run` performs for each admitted command is not exercised here; the inspection core belongs to test_cli_external_inspection.
 */
export const test_cli_command_arguments = (): void => {
  const read = (...args: string[]) => readAutoMovieCommandArguments(args);
  for (const args of [[], ["-h"], ["--help"]])
    TestValidator.equals("standalone help", read(...args), { command: "help" });
  for (const flag of ["-v", "--version"])
    TestValidator.equals("standalone version", read(flag), {
      command: "version",
    });
  for (const language of ["chinese", "english", "japanese", "korean"] as const)
    TestValidator.equals(
      "explicit project language",
      read("start", "project", "--language", language),
      {
        command: "start",
        directory: "project",
        language,
        force: false,
      },
    );
  TestValidator.equals(
    "explicit replacement authority",
    read("start", "--force", "project", "--language", "english"),
    {
      command: "start",
      directory: "project",
      language: "english",
      force: true,
    },
  );
  TestValidator.equals("index publication", read("toc"), {
    command: "toc",
    check: false,
  });
  TestValidator.equals("index observation", read("toc", "--check"), {
    command: "toc",
    check: true,
  });
  for (const kind of ["film", "brief", "library"] as const)
    TestValidator.equals("source capability routes", read("routes", kind), {
      command: "routes",
      kind,
    });
  for (const profile of [
    "gltf-static-v1",
    "gltf-humanoid-v1",
    "gltf-motion-v1",
    "vrm-humanoid-v1",
  ] as const)
    TestValidator.equals(
      "explicit external profile",
      read("inspect-external", "model.glb", "--profile", profile),
      {
        command: "inspect-external",
        path: "model.glb",
        profile,
      },
    );

  const invalid = [
    ["--help", "extra"],
    ["--version", "extra"],
    ["unknown"],
    ["migrate"],
    ["contracts", "migrate"],
    ["verify"],
    ["render", "all"],
    ["start"],
    ["start", "project"],
    ["start", "project", "--language"],
    ["start", "project", "--language", "--force"],
    ["start", "project", "--language", "unsupported"],
    ["start", "project", "--language", "english", "--language", "korean"],
    ["start", "project", "--language", "english", "--force", "--force"],
    ["start", "project", "--language", "english", "--unknown"],
    ["start", "one", "two", "--language", "english"],
    ["start", " ", "--language", "english"],
    ["sync"],
    ["sync", "extra"],
    ["toc", "--check", "--check"],
    ["toc", "--unknown"],
    ["routes"],
    ["routes", "unknown"],
    ["routes", "film", "extra"],
    ["inspect-external"],
    ["inspect-external", "one", "two"],
    ["inspect-external", "model.glb", "--profile"],
    ["inspect-external", "model.glb", "--profile", "--unknown"],
    ["inspect-external", "model.glb", "--profile", "unknown"],
    ["inspect-external", "model.glb", "--unknown"],
    [
      "inspect-external",
      "model.glb",
      "--profile",
      "gltf-static-v1",
      "--profile",
      "gltf-static-v1",
    ],
  ];
  let calls = 0;
  for (const args of invalid)
    TestValidator.predicate(
      "invalid request refuses before dispatch",
      throwsError(() => dispatchAutoMovieCommandArguments(args, () => ++calls)),
    );
  TestValidator.equals("no invalid input reaches effects", calls, 0);
  const result = dispatchAutoMovieCommandArguments(["--help"], (command) => {
    ++calls;
    return command;
  });
  TestValidator.equals("valid dispatch returns its selected command", result, {
    command: "help",
  });
  TestValidator.equals("valid dispatch runs once", calls, 1);
};
