import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import {
  formatAutoMovieInspectorAddress,
  readAutoMovieInspectorAddress,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `formatAutoMovieInspectorAddress` writes a request as query text that reads
 * back to it, escaping what a query needs but keeping `,` `:` `;` `/` `@` and
 * `=` readable.
 *
 * Scenarios:
 *
 * 1. The empty request is the empty address.
 * 2. A subject "a&b c" escapes to "a%26b%20c"; "parts=hero/**,prop" and
 *    "color=hero/arm=ff8800" stay readable; the address reads back.
 */
export function test_unit_viewer_inspector_format_address(): void {
  TestValidator.equals(
    "the empty request",
    formatAutoMovieInspectorAddress(readAutoMovieInspectorAddress("")),
    "",
  );
  const request: IAutoMovieCapturePlanRequest = readAutoMovieInspectorAddress(
    `subject=${encodeURIComponent("a&b c")}&parts=hero/**,prop&color=hero/arm=ff8800`,
  );
  const address: string = formatAutoMovieInspectorAddress(request);
  TestValidator.predicate(
    "escaped and readable",
    address.includes("subject=a%26b%20c") &&
      address.includes("parts=hero/**,prop") &&
      address.includes("color=hero/arm=ff8800"),
  );
  TestValidator.equals(
    "reads back",
    readAutoMovieInspectorAddress(address),
    request,
  );
}
