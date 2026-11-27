import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import { AutoMovieViewerInspector } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieViewerInspector.formatAddress` writes a request as query text that reads
 * back to it, escaping what a query needs but keeping `,` `:` `;` `/` `@` and
 * `=` readable.
 *
 * Scenarios:
 *
 * 1. The empty request is the empty address.
 * 2. A subject "a&b c" escapes to "a%26b%20c"; "parts=hero/**,prop" and
 *    "color=hero/arm=ff8800" stay readable; the address reads back.
 */
export function test_viewer_inspector_format_address(): void {
  TestValidator.equals(
    "the empty request",
    AutoMovieViewerInspector.formatAddress(AutoMovieViewerInspector.readAddress("")),
    "",
  );
  const request: IAutoMovieCapturePlanRequest = AutoMovieViewerInspector.readAddress(
    `subject=${encodeURIComponent("a&b c")}&parts=hero/**,prop&color=hero/arm=ff8800`,
  );
  const address: string = AutoMovieViewerInspector.formatAddress(request);
  TestValidator.predicate(
    "escaped and readable",
    address.includes("subject=a%26b%20c") &&
      address.includes("parts=hero/**,prop") &&
      address.includes("color=hero/arm=ff8800"),
  );
  TestValidator.equals(
    "reads back",
    AutoMovieViewerInspector.readAddress(address),
    request,
  );
}
