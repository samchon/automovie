import { planAutoMovieCaptureUrl } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `planAutoMovieCaptureUrl` sets the capture's parameters on a local review
 * page's address and drops its autoplay.
 *
 * Scenarios:
 *
 * 1. "http://localhost:5173/review?play=1&x=1" with at=2 becomes
 *    "http://localhost:5173/review?x=1&at=2"; an existing key is replaced.
 * 2. An https page and a remote host are refused.
 */
export function test_unit_render_delivery_plan_capture_url(): void {
  TestValidator.equals(
    "a local page",
    [
      planAutoMovieCaptureUrl("http://localhost:5173/review?play=1&x=1", {
        at: "2",
      }),
      planAutoMovieCaptureUrl("http://127.0.0.1/?at=1", { at: "3" }),
    ],
    ["http://localhost:5173/review?x=1&at=2", "http://127.0.0.1/?at=3"],
  );
  for (const page of ["https://localhost/", "http://example.com/"])
    TestValidator.error(page, (): string => planAutoMovieCaptureUrl(page, {}));
}
