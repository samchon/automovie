import type { IAutoMovieCapturePlanRequest } from "@automovie/interface";
import { AutoMovieRenderCapturePlanKeys, AutoMovieRenderInspectionKeys, AutoMovieRenderCapture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/** A value for every key that differs from its absent value, with the keys it needs beside it. */
const SAMPLES: Readonly<Record<string, readonly [string, string][]>> = {
  subject: [["subject", "duel"]],
  from: [["from", "1"]],
  to: [["to", "3"]],
  rate: [["rate", "10"]],
  at: [["at", "0.5,1"]],
  events: [["events", "2"]],
  cue: [["cue", "seat.contact"]],
  entry: [
    ["cue", "seat.contact"],
    ["entry", "1"],
  ],
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
 * Every option of the grammar exists in both hosts: each key of `AutoMovieRenderCapturePlanKeys` reaches the request through the address mapping and through the command-line mapping alike, and no host has an option of its own.
 *
 * Scenarios:
 *
 * 1. The key list is the capture's own keys followed by `AutoMovieRenderInspectionKeys`, each once, and this test has a sample for exactly those keys.
 * 2. For every key, its sample read through `URLSearchParams` and through `AutoMovieRenderCapture.readArguments` gives equal requests.
 * 3. For every key, the request with the key differs from the request with only the keys it needs, so the key is not ignored by either host.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads each key through both host mappings into the public reader and compares the requests; a key that one mapping dropped, or that the reader ignored, fails scenario 2 or 3.
 * @evidence contracts/development/testing.md#independent-expectations The hand-written samples define which keys require another option and how they differ from their absent values. For example, entry 1 requires the seat.contact cue, and deleting only entry leaves the cue itself in the request.
 * @evidence contracts/development/common.md#meaningful-documentation The sample table covers each declared capture and inspection key once. Both host forms must give the same request, and a sample must change the request from its absent form.
 */
export function test_capture_request_keys(): void {
  // 1. The key list.
  TestValidator.equals(
    "the inspection keys close the list",
    AutoMovieRenderCapturePlanKeys.slice(-AutoMovieRenderInspectionKeys.length),
    [...AutoMovieRenderInspectionKeys],
  );
  TestValidator.equals(
    "every key is listed once",
    new Set(AutoMovieRenderCapturePlanKeys).size,
    AutoMovieRenderCapturePlanKeys.length,
  );
  TestValidator.equals(
    "every key has a sample",
    [...AutoMovieRenderCapturePlanKeys].sort((a: string, b: string): number =>
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
    AutoMovieRenderCapture.parsePlanRequest(new URLSearchParams([...pairs]));
  const command: (
    pairs: readonly [string, string][],
  ) => IAutoMovieCapturePlanRequest = (
    pairs: readonly [string, string][],
  ): IAutoMovieCapturePlanRequest =>
    AutoMovieRenderCapture.parsePlanRequest(
      AutoMovieRenderCapture.readArguments(
        pairs.flatMap(([key, value]: readonly [string, string]): string[] => [
          `--${key}=${value}`,
        ]),
      ),
    );
  for (const key of AutoMovieRenderCapturePlanKeys) {
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
