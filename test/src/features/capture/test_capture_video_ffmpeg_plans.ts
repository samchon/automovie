import {
  planAutoMovieVideoFrames,
  planAutoMovieVideoSceneCuts,
  readAutoMovieVideoSceneCuts,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/**
 * The FFmpeg runs of a video capture are planned as argument lists and their report read as data: one `select` expression naming exactly the planned frames with passthrough timing, and `scdet` cuts written to a report that reads back into seconds and scores.
 *
 * Scenarios:
 *
 * 1. Frames 57 to 63, 90 and 92, given unsorted with a repeat, plan `select='between(n,57,63)+eq(n,90)+eq(n,92)'`, `-fps_mode passthrough`, RGB stills numbered from `s00000.png` in the given folder, and no shell quoting.
 * 2. An empty frame list and a negative or fractional index are refused.
 * 3. Scene-cut detection at threshold 10 plans `scdet=threshold=10` with the metadata filters printing to the report, and a report path holding a drive colon and a comma is escaped for both filter-graph levels.
 * 4. A threshold above 100 is refused.
 * 5. A report of two marked frames, with Windows line endings and an extra key, reads as two cuts with their seconds and scores; a frame without `lavfi.scd.time` falls back to its `pts_time`.
 * 6. An empty report reads as no cut, and a marked frame without a score is refused naming it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public planners and reader and inspects the argument lists and parsed cuts; a select expression naming other frames, a missing passthrough, an unescaped path or a reader that dropped a cut fails. No FFmpeg is launched.
 * @evidence contracts/development/testing.md#independent-expectations The expected arguments follow FFmpeg's documented `select`, `eq`, `between`, `scdet` and `metadata` syntax and its two-level filter-graph escaping; the report text is written by hand in the `metadata` filter's print format.
 * @evidence contracts/development/testing.md#distinguishing-cases Runs against lone frames, a repeated frame, refusals, plain and special-character paths, both line endings, the time key against its fallback, empty and malformed reports. Running the planned arguments is owned by `test_capture_video_pairing`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_capture_video_ffmpeg_plans`; it starts no process.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_capture_video_ffmpeg_plans(): void {
  // 1. Exactly the planned frames.
  TestValidator.equals(
    "one select names exactly the frames",
    planAutoMovieVideoFrames({
      file: "in.mp4",
      frames: [92, 60, 57, 58, 59, 61, 62, 63, 90, 60],
      directory: "out/file",
    }),
    [
      "-hide_banner",
      "-nostats",
      "-y",
      "-i",
      "in.mp4",
      "-an",
      "-vf",
      "select='between(n,57,63)+eq(n,90)+eq(n,92)'",
      "-fps_mode",
      "passthrough",
      "-pix_fmt",
      "rgb24",
      "-start_number",
      "0",
      "out/file/s%05d.png",
    ],
  );

  // 2. Refusals.
  for (const frames of [[], [-1], [1.5]])
    TestValidator.predicate(
      `frames ${JSON.stringify(frames)} are refused`,
      throwsError((): unknown =>
        planAutoMovieVideoFrames({ file: "in.mp4", frames, directory: "o" }),
      ),
    );

  // 3. Scene cuts.
  TestValidator.equals(
    "scdet prints cuts to the report",
    planAutoMovieVideoSceneCuts({
      file: "in.mp4",
      report: "out/scenecut.txt",
      threshold: 10,
    }),
    [
      "-hide_banner",
      "-nostats",
      "-i",
      "in.mp4",
      "-an",
      "-vf",
      "scdet=threshold=10,metadata=mode=select:key=lavfi.scd.time,metadata=mode=print:file=out/scenecut.txt",
      "-f",
      "null",
      "-",
    ],
  );
  TestValidator.equals(
    "a drive colon and a comma are escaped twice",
    planAutoMovieVideoSceneCuts({
      file: "in.mp4",
      report: "D:/a,b/cut.txt",
      threshold: 10,
    })[6],
    "scdet=threshold=10,metadata=mode=select:key=lavfi.scd.time,metadata=mode=print:file=D\\\\:/a\\,b/cut.txt",
  );

  // 4. Threshold.
  TestValidator.predicate(
    "a threshold above 100 is refused",
    throwsError(
      (): unknown =>
        planAutoMovieVideoSceneCuts({ file: "a", report: "b", threshold: 101 }),
      "101",
    ),
  );

  // 5. A report with two cuts.
  TestValidator.equals(
    "two cuts read back",
    readAutoMovieVideoSceneCuts(
      [
        "frame:59   pts:60060   pts_time:2.002",
        "lavfi.scd.mafd=31.2",
        "lavfi.scd.score=23.456",
        "lavfi.scd.time=2.002",
        "frame:149  pts:150150  pts_time:5.005",
        "lavfi.scd.score=41",
        "",
      ].join("\r\n"),
    ),
    [
      { seconds: 2.002, score: 23.456 },
      { seconds: 5.005, score: 41 },
    ],
  );

  // 6. Empty and malformed reports.
  TestValidator.equals(
    "an empty report is no cut",
    readAutoMovieVideoSceneCuts(""),
    [],
  );
  TestValidator.predicate(
    "a frame without a score is refused",
    throwsError(
      (): unknown =>
        readAutoMovieVideoSceneCuts(
          "frame:3 pts:3 pts_time:0.1\nlavfi.scd.time=0.1\n",
        ),
      "frame:3",
    ),
  );
}
