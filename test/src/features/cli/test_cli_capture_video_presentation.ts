import assert from "node:assert/strict";

import { readVideoPresentation } from "../../../../packages/cli/src/capture/internal/readVideoPresentation";

/**
 * Exact selected-stream presentation timing belongs to the decoder run.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes input stream identity, signed time-base ticks and incomplete or wrong selections.
 * @evidence contracts/development/testing.md#behavioral-verification Supplies FFmpeg mapping and showinfo output to the capture adapter's log reader and checks the parsed receipt and refusal states.
 * @evidence contracts/development/testing.md#independent-expectations The filter's selected rows zero and one correspond to requested source indices three and four. Their input ticks are -500 and 800 in a time base of 1/1000, independently of the stream's nominal frame rate.
 */
export function test_cli_capture_video_presentation(): void {
  const log: string = [
    "Stream mapping:",
    "  Stream #0:2 -> #0:0 (h264 (native) -> png (native))",
    "[Parsed_showinfo_1 @ trace] config in time_base: 1/1000, frame_rate: 10/1",
    "[Parsed_showinfo_1 @ trace] n: 0 pts: -500 pts_time:-0.5",
    "[Parsed_showinfo_1 @ trace] n: 1 pts: 800 pts_time:0.8",
  ].join("\n");
  const source: string = "a".repeat(64);
  assert.deepEqual(readVideoPresentation(log, 2, source, [3, 4]), {
    type: "decoded",
    fileSha256: source,
    streamIndex: 2,
    timeBase: [1, 1000],
    frames: [
      { frame: 3, ticks: -500 },
      { frame: 4, ticks: 800 },
    ],
  });
  assert.equal(
    readVideoPresentation(log, 0, source, [3, 4]).type,
    "unavailable",
  );
  assert.equal(
    readVideoPresentation(log, 2, source, [3, 4, 5]).type,
    "unavailable",
  );
  assert.equal(
    readVideoPresentation(log.replace("n: 1", "n: 3"), 2, source, [3, 4]).type,
    "unavailable",
  );
  assert.equal(
    readVideoPresentation(
      log.replace("800 pts_time", "NOPTS pts_time"),
      2,
      source,
      [3, 4],
    ).type,
    "unavailable",
  );
}
