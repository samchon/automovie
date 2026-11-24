import {
  parseAutoMovieCapturePlanRequest,
  readAutoMovieCaptureArguments,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * A key the grammar does not have stops the request in either host, naming the key, so a mistyped option is never silently ignored; a key given twice stops it too.
 *
 * Scenarios:
 *
 * 1. `film`, `view`, `w` and `paths`, options of the old page and command, are refused through an address and through a command line, each error naming the key.
 * 2. An unknown key beside valid ones is refused before any value is read, so a malformed valid key does not hide it.
 * 3. A key given twice in an address is refused naming it.
 * 4. The same text with only known keys is read.
 */
export function test_unit_render_capture_request_unknown_key(): void {
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
