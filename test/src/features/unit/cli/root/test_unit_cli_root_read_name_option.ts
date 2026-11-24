import { TestValidator } from "@nestia/e2e";
import { readAutoMovieNameOption } from "automovie";

/**
 * `readAutoMovieNameOption` admits the token after `--name` when it is present,
 * not blank and not an option.
 *
 * Scenarios:
 *
 * 1. "my-film" is returned as typed, including surrounding spaces.
 * 2. A missing token, " " and "--force" refuse.
 */
export function test_unit_cli_root_read_name_option(): void {
  TestValidator.equals("a name", readAutoMovieNameOption("my-film"), "my-film");
  TestValidator.equals(
    "as typed",
    readAutoMovieNameOption(" my-film "),
    " my-film ",
  );
  for (const value of [undefined, "   ", "--force"])
    TestValidator.error(`${value} refuses`, (): string =>
      readAutoMovieNameOption(value),
    );
}
