import { AutoMovieRenderCapture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `planCaptureUrl` sets the capture's parameters on a local review
 * page's address and drops its autoplay.
 *
 * Scenarios:
 *
 * 1. "http://localhost:5173/review?play=1&x=1" with at=2 becomes
 *    "http://localhost:5173/review?x=1&at=2"; an existing key is replaced.
 * 2. An https page and a remote host are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Adds capture parameters to a local review URL and removes autoplay.
 * @evidence contracts/development/testing.md#behavioral-verification Calls URL planning with a query containing autoplay and another value, plus nonlocal or unsupported addresses.
 * @evidence contracts/development/testing.md#independent-expectations Literal output URLs retain unrelated query data, add the requested capture second and replace an existing parameter. Unsupported addresses exercise refusal.
 */
export function test_render_delivery_plan_capture_url(): void {
  TestValidator.equals(
    "a local page",
    [
      AutoMovieRenderCapture.planUrl("http://localhost:5173/review?play=1&x=1", {
        at: "2",
      }),
      AutoMovieRenderCapture.planUrl("http://127.0.0.1/?at=1", { at: "3" }),
    ],
    ["http://localhost:5173/review?x=1&at=2", "http://127.0.0.1/?at=3"],
  );
  for (const page of ["https://localhost/", "http://example.com/"])
    TestValidator.error(page, (): string => AutoMovieRenderCapture.planUrl(page, {}));
}
