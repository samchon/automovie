import { AutoMovieRenderCapture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/**
 * The FFmpeg runs of a video capture are planned as argument lists and their report read as data: one `select` expression naming exactly the planned frames with passthrough timing, and `scdet` cuts written to a report that reads back into seconds and scores.
 *
 * Scenarios:
 *
 * 1. Unsorted frames 57 to 63, 90 and 92 with a repeat select the first video stream. The plan uses `select='between(n,57,63)+eq(n,90)+eq(n,92)'`, `-fps_mode passthrough` and RGB stills numbered from `s00000.png` in the given folder.
 * 2. An empty frame list and a negative index are refused.
 * 3. Scene-cut detection selects the first video stream and runs `scdet=threshold=10`. The metadata filters print to the report, escaping a drive colon and a comma for both filter-graph levels.
 * 4. A threshold above 100 is refused.
 * 5. A report of two marked frames, with Windows line endings and an extra key, reads as two cuts with their seconds and scores; a frame without `lavfi.scd.time` falls back to its `pts_time`.
 * 6. An empty report reads as no cut, and a marked frame without a score is refused naming it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public planners and report reader with literal inputs and asserts the argument lists, invalid-input errors and parsed cuts. Both command vectors must explicitly map the first video stream.
 * @evidence contracts/development/testing.md#independent-expectations The expected arguments name the first video stream as 0:v:0 and enumerate the independent frame runs and scene filter syntax. The hand-written metadata report prescribes the two expected times and scores.
 * @evidence contracts/development/common.md#meaningful-documentation Literal argument vectors cover stream mapping, frame selection, output numbering and filter escaping. Cut reports cover primary and fallback timing, no cuts and a missing score.
 */
export function test_capture_video_ffmpeg_plans(): void {
  // 1. Exactly the planned frames.
  TestValidator.equals(
    "one select names exactly the frames",
    AutoMovieRenderCapture.planVideoFrames({
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
      "-map",
      "0:v:0",
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
  for (const frames of [[], [-1]])
    TestValidator.predicate(
      `frames ${JSON.stringify(frames)} are refused`,
      throwsError((): unknown =>
        AutoMovieRenderCapture.planVideoFrames({ file: "in.mp4", frames, directory: "o" }),
      ),
    );

  // 3. Scene cuts.
  TestValidator.equals(
    "scdet prints cuts to the report",
    AutoMovieRenderCapture.planVideoSceneCuts({
      file: "in.mp4",
      report: "out/scenecut.txt",
      threshold: 10,
    }),
    [
      "-hide_banner",
      "-nostats",
      "-i",
      "in.mp4",
      "-map",
      "0:v:0",
      "-an",
      "-vf",
      "scdet=threshold=10,metadata=mode=select:key=lavfi.scd.time,metadata=mode=print:file=out/scenecut.txt",
      "-f",
      "null",
      "-",
    ],
  );
  const escaped: string[] = AutoMovieRenderCapture.planVideoSceneCuts({
    file: "in.mp4",
    report: "D:/a,b/cut.txt",
    threshold: 10,
  });
  TestValidator.equals(
    "a drive colon and a comma are escaped twice",
    escaped[escaped.indexOf("-vf") + 1],
    "scdet=threshold=10,metadata=mode=select:key=lavfi.scd.time,metadata=mode=print:file=D\\\\:/a\\,b/cut.txt",
  );

  // 4. Threshold.
  TestValidator.predicate(
    "a threshold above 100 is refused",
    throwsError(
      (): unknown =>
        AutoMovieRenderCapture.planVideoSceneCuts({ file: "a", report: "b", threshold: 101 }),
      "101",
    ),
  );

  // 5. A report with two cuts.
  TestValidator.equals(
    "two cuts read back",
    AutoMovieRenderCapture.readVideoSceneCuts(
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
    AutoMovieRenderCapture.readVideoSceneCuts(""),
    [],
  );
  TestValidator.predicate(
    "a frame without a score is refused",
    throwsError(
      (): unknown =>
        AutoMovieRenderCapture.readVideoSceneCuts(
          "frame:3 pts:3 pts_time:0.1\nlavfi.scd.time=0.1\n",
        ),
      "frame:3",
    ),
  );
}
