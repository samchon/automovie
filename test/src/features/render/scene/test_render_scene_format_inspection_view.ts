import type { IAutoMovieVector3 } from "@automovie/interface";
import { AutoMovieRenderInspectionRequest } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `formatInspectionView` writes a view as the `views` text the
 * inspection request reads.
 *
 * Scenarios:
 *
 * 1. The film view is "film".
 * 2. A fixed view from (-1, 1.6, 4) to (0, 1, 0) is "-1,1.6,4:0,1,0", with
 *    "@ortho=0.005" and "@up=0,0,-1" when it has them.
 * 3. A named front view is "front", with "@ortho@follow" and "@flagged" or
 *    "@focus=hero/arm" as set.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The examples specify the inspection text for film, fixed, and named views and their optional qualifiers.
 * @evidence contracts/development/testing.md#behavioral-verification Checks that a fixed view retains coordinates and projection qualifiers while a named view retains its framing and focus options.
 * @evidence contracts/development/testing.md#independent-expectations Compares with literal strings for film, fixed coordinates, front orthographic follow, flagged filtering, and an entity path.
 */
export function test_render_scene_format_inspection_view(): void {
  const position: IAutoMovieVector3 = { x: -1, y: 1.6, z: 4 };
  const target: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  TestValidator.equals(
    "views",
    [
      AutoMovieRenderInspectionRequest.formatView({ type: "film" }),
      AutoMovieRenderInspectionRequest.formatView({
        type: "fixed",
        position,
        target,
        metresPerPixel: null,
        up: null,
      }),
      AutoMovieRenderInspectionRequest.formatView({
        type: "fixed",
        position,
        target,
        metresPerPixel: 0.005,
        up: { x: 0, y: 0, z: -1 },
      }),
      AutoMovieRenderInspectionRequest.formatView({
        type: "named",
        name: "front",
        orthographic: false,
        follow: false,
        focus: null,
      }),
      AutoMovieRenderInspectionRequest.formatView({
        type: "named",
        name: "front",
        orthographic: true,
        follow: true,
        focus: { type: "flagged" },
      }),
      AutoMovieRenderInspectionRequest.formatView({
        type: "named",
        name: "side",
        orthographic: false,
        follow: false,
        focus: { type: "pattern", pattern: "hero/arm" },
      }),
    ],
    [
      "film",
      "-1,1.6,4:0,1,0",
      "-1,1.6,4:0,1,0@ortho=0.005@up=0,0,-1",
      "front",
      "front@ortho@follow@flagged",
      "side@focus=hero/arm",
    ],
  );
}
