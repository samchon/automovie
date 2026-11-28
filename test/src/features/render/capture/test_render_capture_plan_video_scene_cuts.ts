import { AutoMovieRenderCapture } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `planVideoSceneCuts` writes the ffmpeg arguments that print each
 * scene cut's time to a report file, escaping the file once as a filter option
 * and again inside the filter graph.
 *
 * Scenarios:
 *
 * 1. Report "a:b,c.txt" at threshold 10: the option escapes ":" to "a:b,c.txt" and
 *    the graph escapes "" and "," to "a:b,c.txt".
 * 2. Thresholds -1 and 101 are refused; 0 and 100 are not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names filter-path escaping, threshold limits and selected stream mapping.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public scene-cut planner and compares its ordered FFmpeg arguments and threshold refusals.
 * @evidence contracts/development/testing.md#independent-expectations FFmpeg filter options require escaping the colon and filter graphs also require escaping a comma. Stream mapping addresses the explicit input index when present.
 */
export function test_render_capture_plan_video_scene_cuts(): void {
  TestValidator.equals(
    "arguments",
    AutoMovieRenderCapture.planVideoSceneCuts({
      file: "film.mp4",
      report: "a:b,c.txt",
      threshold: 10,
    }),
    [
      "-hide_banner",
      "-nostats",
      "-i",
      "film.mp4",
      "-map",
      "0:v:0",
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
      AutoMovieRenderCapture.planVideoSceneCuts({ file: "f", report: "r", threshold }),
    );
  TestValidator.equals(
    "the bounds",
    [0, 100].map(
      (threshold: number): number =>
        AutoMovieRenderCapture.planVideoSceneCuts({ file: "f", report: "r", threshold })
          .length,
    ),
    [12, 12],
  );
  const selected = AutoMovieRenderCapture.planVideoSceneCuts({ file: "f", report: "r", threshold: 10, streamIndex: 3 });
  TestValidator.equals("explicit stream", selected[selected.indexOf("-map") + 1], "0:3");
}
