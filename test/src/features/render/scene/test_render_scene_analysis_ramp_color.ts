import type { IAutoMovieColor } from "@automovie/interface";
import { AutoMovieRenderAnalysisOverlay } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderAnalysisOverlay.rampColor` maps a unit position onto a blue, green, red
 * ramp, linear per channel, clamped outside `[0, 1]`.
 *
 * Scenarios:
 *
 * 1. The stops 0, 0.25, 0.5, 0.75 and 1 give blue, blue-green, green,
 *    green-red and red.
 * 2. Positions below 0 and above 1 clamp to the end stops.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the ramp's channel order, half-way colors and clamped endpoints.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public ramp on scalar positions at both endpoints, both interpolated halves, the center stop and positions outside the domain.
 * @evidence contracts/development/testing.md#independent-expectations The blue, green and red stops occur at 0, 0.5 and 1. Their adjacent channel averages give the expected quarter positions. Inputs −3 and 7 must return the literal endpoint colors.
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
      AutoMovieRenderAnalysisOverlay.rampColor(position),
      expected,
    );
}
