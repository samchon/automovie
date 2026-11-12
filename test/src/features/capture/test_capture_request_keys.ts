import {
  AUTO_MOVIE_CAPTURE_PLAN_KEYS,
  AUTO_MOVIE_INSPECTION_KEYS,
  type IAutoMovieCapturePlanRequest,
  parseAutoMovieCapturePlanRequest,
  readAutoMovieCaptureArguments,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/** A value for every key that differs from its absent value, with the keys it needs beside it. */
const SAMPLES: Readonly<Record<string, readonly [string, string][]>> = {
  subject: [["subject", "duel"]],
  from: [["from", "1"]],
  to: [["to", "3"]],
  rate: [["rate", "10"]],
  at: [["at", "0.5,1"]],
  events: [["events", "2"]],
  window: [["window", "5"]],
  threshold: [["threshold", "25"]],
  views: [["views", "front;top@ortho"]],
  passes: [["passes", "clay,normal"]],
  sweep: [["sweep", "hero/*"]],
  margin: [
    ["sweep", "hero/*"],
    ["margin", "0.1"],
  ],
  longest: [["longest", "2576"]],
  smallest: [["smallest", "256"]],
  reduction: [["reduction", "nearest"]],
  round: [["round", "after"]],
  compare: [["compare", "before"]],
  tolerance: [
    ["compare", "before"],
    ["tolerance", "3"],
  ],
  parts: [["parts", "hero"]],
  hide: [["hide", "prop"]],
  shade: [["shade", "faces"]],
  surface: [["surface", "0"]],
  marks: [["marks", "curve/**"]],
  sliver: [["sliver", "6"]],
  section: [["section", "y:1.2"]],
  xray: [["xray", "1"]],
  stroke: [["stroke", "5"]],
  label: [["label", "hero/*"]],
  color: [["color", "hero/arm=ff8800"]],
  trail: [["trail", "hero/*Hand"]],
  reach: [["reach", "0.5"]],
  ticks: [["ticks", "10"]],
};

/**
 * Every option of the grammar exists in both hosts: each key of `AUTO_MOVIE_CAPTURE_PLAN_KEYS` reaches the request through the address mapping and through the command-line mapping alike, and no host has an option of its own.
 *
 * Scenarios:
 *
 * 1. The key list is the capture's own keys followed by `AUTO_MOVIE_INSPECTION_KEYS`, each once, and this test has a sample for exactly those keys.
 * 2. For every key, its sample read through `URLSearchParams` and through `readAutoMovieCaptureArguments` gives equal requests.
 * 3. For every key, the request with the key differs from the request with only the keys it needs, so the key is not ignored by either host.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads each key through both host mappings into the public reader and compares the requests; a key that one mapping dropped, or that the reader ignored, fails scenario 2 or 3.
 * @evidence contracts/development/testing.md#independent-expectations Each sample is written by hand from the reader's documented table to differ from that key's absent value; the key set is checked against the samples, so a key added to the grammar without a sample fails until this test covers it.
 * @evidence contracts/development/testing.md#distinguishing-cases Every key, each against the same request without it; keys that need another (`margin`, `tolerance`) are checked with that key present on both sides. Values each key refuses are owned by `test_capture_request_malformed_value`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_request_keys`; it builds its text in memory and starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_capture_request_keys(): void {
  // 1. The key list.
  TestValidator.equals(
    "the inspection keys close the list",
    AUTO_MOVIE_CAPTURE_PLAN_KEYS.slice(-AUTO_MOVIE_INSPECTION_KEYS.length),
    [...AUTO_MOVIE_INSPECTION_KEYS],
  );
  TestValidator.equals(
    "every key is listed once",
    new Set(AUTO_MOVIE_CAPTURE_PLAN_KEYS).size,
    AUTO_MOVIE_CAPTURE_PLAN_KEYS.length,
  );
  TestValidator.equals(
    "every key has a sample",
    [...AUTO_MOVIE_CAPTURE_PLAN_KEYS].sort((a: string, b: string): number =>
      a < b ? -1 : a > b ? 1 : 0,
    ),
    Object.keys(SAMPLES).sort((a: string, b: string): number =>
      a < b ? -1 : a > b ? 1 : 0,
    ),
  );

  // 2 and 3. Each key through both hosts, and against its absence.
  const address: (
    pairs: readonly [string, string][],
  ) => IAutoMovieCapturePlanRequest = (
    pairs: readonly [string, string][],
  ): IAutoMovieCapturePlanRequest =>
    parseAutoMovieCapturePlanRequest(new URLSearchParams([...pairs]));
  const command: (
    pairs: readonly [string, string][],
  ) => IAutoMovieCapturePlanRequest = (
    pairs: readonly [string, string][],
  ): IAutoMovieCapturePlanRequest =>
    parseAutoMovieCapturePlanRequest(
      readAutoMovieCaptureArguments(
        pairs.flatMap(([key, value]: readonly [string, string]): string[] => [
          `--${key}=${value}`,
        ]),
      ),
    );
  for (const key of AUTO_MOVIE_CAPTURE_PLAN_KEYS) {
    const pairs: readonly [string, string][] = SAMPLES[key]!;
    const without: readonly [string, string][] = pairs.filter(
      ([name]: readonly [string, string]): boolean => name !== key,
    );
    TestValidator.equals(
      `${key} reads alike in both hosts`,
      command(pairs),
      address(pairs),
    );
    TestValidator.predicate(
      `${key} changes the request`,
      JSON.stringify(address(pairs)) !== JSON.stringify(address(without)),
    );
  }
}
