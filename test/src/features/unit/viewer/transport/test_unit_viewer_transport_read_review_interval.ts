import { readAutoMovieReviewInterval } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * `readAutoMovieReviewInterval` reads `start`, `end` and `speed` from a URL,
 * defaulting to the available range at speed 1, and refuses rather than clamps
 * a value outside it.
 *
 * Scenarios:
 *
 * 1. No parameter over [0, 10]: { 0, 10, 1 }.
 * 2. "?start=2&end=4&speed=0.5": { 2, 4, 0.5 }.
 * 3. An empty start, a start of "abc", an overflowing end, an end past 10, a
 *    start at the end and speed 2 refuse.
 */
export function test_unit_viewer_transport_read_review_interval(): void {
  const read: (query: string) => {
    start: number;
    end: number;
    speed: number;
  } = (query: string): { start: number; end: number; speed: number } =>
    readAutoMovieReviewInterval(new URLSearchParams(query), [0, 10]);
  TestValidator.equals("the defaults", read(""), {
    start: 0,
    end: 10,
    speed: 1,
  });
  TestValidator.equals("requested", read("start=2&end=4&speed=0.5"), {
    start: 2,
    end: 4,
    speed: 0.5,
  });
  for (const query of [
    "start=",
    "start=abc",
    "end=1e999",
    "end=11",
    "start=5&end=5",
    "speed=2",
  ])
    TestValidator.error(query, (): unknown => read(query));
}
