import { TestValidator } from "@nestia/e2e";

import { summarizeCaptureComparison } from "../../../src/executable/summarizeCaptureComparison";

/**
 * Pin the record a round comparison writes.
 *
 * Scenarios:
 * 1. A run of three stills of which the earlier round has two, one of them changed: two compared, one changed, the third missing, and the compared stills listed with their numbers in order.
 * 2. A run of which the earlier round has no still: nothing compared, nothing changed, every still missing.
 * 3. A run whose stills all have an unchanged counterpart: all compared, none changed, none missing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment lists the three scenarios and what each pins.
 * @evidence contracts/development/testing.md#behavioral-verification Calls summarizeCaptureComparison and asserts the whole record; a still without a counterpart counted as compared or as unchanged, an unchanged still counted as changed, a lost reference or tolerance or reordered entries fails.
 * @evidence contracts/development/testing.md#independent-expectations Every count and the missing list are read off the literal entries by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Changed, unchanged and missing stills in one run, a run with nothing to compare and a run with nothing changed or missing.
 * @evidence contracts/development/testing.md#execution-ownership A pure unit test with literal records, discovered by test/index.ts as an exported test_ function.
 */
export function test_summarize_capture_comparison(): void {
  const reference: string = "media/capture/rounds/before";
  const unchanged = (
    frame: string,
  ): Parameters<typeof summarizeCaptureComparison>[0]["entries"][number] => ({
    frame,
    changed: 0,
    ratio: 0,
    maximum: 3,
    bounds: null,
  });
  const moved: Parameters<
    typeof summarizeCaptureComparison
  >[0]["entries"][number] = {
    frame: "t000.200.png",
    changed: 12,
    ratio: 0.5,
    maximum: 200,
    bounds: { left: 1, top: 2, right: 4, bottom: 3 },
  };
  const frames: string[] = ["t000.000.png", "t000.200.png", "t000.400.png"];

  // 1. Changed, unchanged and missing.
  TestValidator.equals(
    "a run the earlier round partly has",
    summarizeCaptureComparison({
      reference,
      tolerance: 4,
      frames,
      entries: [unchanged("t000.000.png"), moved],
    }),
    {
      reference,
      tolerance: 4,
      compared: 2,
      changed: 1,
      missing: ["t000.400.png"],
      frames: [unchanged("t000.000.png"), moved],
    },
  );

  // 2. Nothing to compare.
  TestValidator.equals(
    "a run the earlier round does not have",
    summarizeCaptureComparison({
      reference,
      tolerance: 0,
      frames,
      entries: [],
    }),
    {
      reference,
      tolerance: 0,
      compared: 0,
      changed: 0,
      missing: frames,
      frames: [],
    },
  );

  // 3. Nothing changed, nothing missing.
  TestValidator.equals(
    "a run that left every still alone",
    summarizeCaptureComparison({
      reference,
      tolerance: 0,
      frames,
      entries: frames.map(unchanged),
    }),
    {
      reference,
      tolerance: 0,
      compared: 3,
      changed: 0,
      missing: [],
      frames: frames.map(unchanged),
    },
  );
}
