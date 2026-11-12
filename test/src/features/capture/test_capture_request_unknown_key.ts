import {
  parseAutoMovieCapturePlanRequest,
  readAutoMovieCaptureArguments,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/**
 * A key the grammar does not have stops the request in either host, naming the key, so a mistyped option is never silently ignored; a key given twice stops it too.
 *
 * Scenarios:
 *
 * 1. `film`, `view`, `w` and `paths`, options of the old page and command, are refused through an address and through a command line, each error naming the key.
 * 2. An unknown key beside valid ones is refused before any value is read, so a malformed valid key does not hide it.
 * 3. A key given twice in an address is refused naming it.
 * 4. The same text with only known keys is read.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Parses unknown and repeated keys through both host mappings and observes the refusal and its message; a reader that ignored unknown keys or took the first of two values fails.
 * @evidence contracts/development/testing.md#independent-expectations The refused names are options the scaffold's page and command read before the shared grammar (`film`, `view`, `w`, `paths`), which issue #3300 removes; the expected message fragment is the key itself.
 * @evidence contracts/development/testing.md#distinguishing-cases Unknown against known keys, unknown beside a malformed known value, a repeated key, and the accepted control. Malformed values of known keys are owned by `test_capture_request_malformed_value`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_request_unknown_key`; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_capture_request_unknown_key(): void {
  // 1. Old host-only options, through both hosts.
  for (const key of ["film", "view", "w", "paths"]) {
    TestValidator.predicate(
      `the address refuses ${key}`,
      throwsError(
        (): unknown =>
          parseAutoMovieCapturePlanRequest(new URLSearchParams([[key, "1"]])),
        `"${key}"`,
      ),
    );
    TestValidator.predicate(
      `the command line refuses ${key}`,
      throwsError(
        (): unknown =>
          parseAutoMovieCapturePlanRequest(
            readAutoMovieCaptureArguments([`--${key}`, "1"]),
          ),
        `"${key}"`,
      ),
    );
  }

  // 2. The unknown key is named before a malformed value is read.
  TestValidator.predicate(
    "an unknown key is refused first",
    throwsError(
      (): unknown =>
        parseAutoMovieCapturePlanRequest(
          new URLSearchParams("rate=fast&colour=red"),
        ),
      '"colour"',
    ),
  );

  // 3. A key given twice.
  TestValidator.predicate(
    "a repeated key is refused",
    throwsError(
      (): unknown =>
        parseAutoMovieCapturePlanRequest(new URLSearchParams("rate=5&rate=6")),
      ['"rate"', "twice"],
    ),
  );

  // 4. The control.
  TestValidator.equals(
    "known keys read",
    parseAutoMovieCapturePlanRequest(new URLSearchParams("rate=6&shade=clay"))
      .passes,
    ["clay"],
  );
}
