import { readAutoMovieVideoSceneCuts } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `readAutoMovieVideoSceneCuts` reads cut times and scores from an FFmpeg
 * metadata report.
 *
 * Scenarios:
 *
 * 1. Two frames give their `lavfi.scd.time` and score.
 * 2. A frame without the time takes it from `pts_time` in its header.
 * 3. A frame without a score, or with an unreadable one, is refused, and an
 *    empty report has no cuts.
 */
export function test_render_capture_read_video_scene_cuts(): void {
  TestValidator.equals(
    "two frames",
    readAutoMovieVideoSceneCuts(
      [
        "frame:0    pts:0       pts_time:0",
        "lavfi.scd.score=12.5",
        "lavfi.scd.time=1.5",
        "frame:1    pts:90000   pts_time:3",
        "lavfi.scd.score=40",
        "lavfi.scd.time=3",
      ].join("\n"),
    ),
    [
      { seconds: 1.5, score: 12.5 },
      { seconds: 3, score: 40 },
    ],
  );
  TestValidator.equals(
    "header time",
    readAutoMovieVideoSceneCuts(
      "frame:0 pts:0 pts_time:2.25\nlavfi.scd.score=7",
    ),
    [{ seconds: 2.25, score: 7 }],
  );
  TestValidator.equals("empty", readAutoMovieVideoSceneCuts(""), []);
  for (const report of [
    "frame:0 pts_time:1",
    "frame:0 pts_time:1\nlavfi.scd.score=high",
  ])
    TestValidator.error(report, (): void => {
      readAutoMovieVideoSceneCuts(report);
    });
}