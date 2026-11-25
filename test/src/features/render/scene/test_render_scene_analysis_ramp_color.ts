import type { IAutoMovieColor } from "@automovie/interface";
import { autoMovieAnalysisRampColor } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `autoMovieAnalysisRampColor` maps a unit position onto a blue, green, red
 * ramp, linear per channel, clamped outside `[0, 1]`.
 *
 * Scenarios:
 *
 * 1. The stops 0, 0.25, 0.5, 0.75 and 1 give blue, blue-green, green,
 *    green-red and red.
 * 2. Positions below 0 and above 1 clamp to the end stops.
 */
export function test_render_scene_analysis_ramp_color(): void {
  type Rgb = Pick<IAutoMovieColor, "r" | "g" | "b">;
  const cases: [number, Rgb][] = [
    [0, { r: 0, g: 0, b: 1 }],
    [0.25, { r: 0, g: 0.5, b: 0.5 }],
    [0.5, { r: 0, g: 1, b: 0 }],
    [0.75, { r: 0.5, g: 0.5, b: 0 }],
    [1, { r: 1, g: 0, b: 0 }],
    [-3, { r: 0, g: 0, b: 1 }],
    [7, { r: 1, g: 0, b: 0 }],
  ];
  for (const [position, expected] of cases)
    TestValidator.equals(
      `position ${position}`,
      autoMovieAnalysisRampColor(position),
      expected,
    );
}
