import type { IAutoMovieGuidePassOutput } from "@automovie/interface";
import { planGuidePassOutputs } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `planGuidePassOutputs` gives each distinct pass, in first-occurrence order,
 * its first and last frame and its input pattern under the frame directory.
 *
 * Scenarios:
 *
 * 1. Ten frames of ["depth", "beauty", "depth"] plan depth then beauty, with
 *    frames 0 and 9 and the pass patterns.
 * 2. No passes plan nothing.
 * 3. A zero frame count and an unknown pass throw.
 */
export function test_unit_render_root_plan_guide_pass_outputs(): void {
  TestValidator.equals(
    "depth then beauty",
    planGuidePassOutputs({
      frameDir: "f",
      frameCount: 10,
      passes: ["depth", "beauty", "depth"],
    }),
    [
      {
        pass: "depth",
        firstFrame: "f/frame_00000.depth.png",
        lastFrame: "f/frame_00009.depth.png",
        inputPattern: "f/frame_%05d.depth.png",
      },
      {
        pass: "beauty",
        firstFrame: "f/frame_00000.png",
        lastFrame: "f/frame_00009.png",
        inputPattern: "f/frame_%05d.png",
      },
    ],
  );
  TestValidator.equals(
    "no passes",
    planGuidePassOutputs({ frameDir: "f", frameCount: 1, passes: [] }),
    [],
  );
  TestValidator.error("zero frames", (): IAutoMovieGuidePassOutput[] =>
    planGuidePassOutputs({ frameDir: "f", frameCount: 0, passes: [] }),
  );
  TestValidator.error("an unknown pass", (): IAutoMovieGuidePassOutput[] =>
    planGuidePassOutputs({ frameDir: "f", frameCount: 1, passes: ["sketch"] }),
  );
}
