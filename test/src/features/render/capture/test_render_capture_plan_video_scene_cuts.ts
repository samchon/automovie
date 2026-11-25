import { planAutoMovieVideoSceneCuts } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `planAutoMovieVideoSceneCuts` writes the ffmpeg arguments that print each
 * scene cut's time to a report file, escaping the file once as a filter option
 * and again inside the filter graph.
 *
 * Scenarios:
 *
 * 1. Report "a:b,c.txt" at threshold 10: the option escapes ":" to "a:b,c.txt" and
 *    the graph escapes "" and "," to "a:b,c.txt".
 * 2. Thresholds -1 and 101 are refused; 0 and 100 are not.
 */
export function test_render_capture_plan_video_scene_cuts(): void {
  TestValidator.equals(
    "arguments",
    planAutoMovieVideoSceneCuts({
      file: "film.mp4",
      report: "a:b,c.txt",
      threshold: 10,
    }),
    [
      "-hide_banner",
      "-nostats",
      "-i",
      "film.mp4",
      "-an",
      "-vf",
      "scdet=threshold=10,metadata=mode=select:key=lavfi.scd.time,metadata=mode=print:file=a\\\\:b\\,c.txt",
      "-f",
      "null",
      "-",
    ],
  );
  for (const threshold of [-1, 101])
    TestValidator.error(`threshold ${threshold}`, (): unknown =>
      planAutoMovieVideoSceneCuts({ file: "f", report: "r", threshold }),
    );
  TestValidator.equals(
    "the bounds",
    [0, 100].map(
      (threshold: number): number =>
        planAutoMovieVideoSceneCuts({ file: "f", report: "r", threshold })
          .length,
    ),
    [10, 10],
  );
}
