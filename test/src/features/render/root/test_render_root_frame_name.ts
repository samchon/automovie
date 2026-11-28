import { AutoMovieRenderMedia } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieRenderMedia.frameName` zero-pads a frame index into `frame_<index>.<ext>`.
 *
 * Scenarios:
 *
 * 1. Frame 42: frame_00042.png.
 * 2. Frame 7 as jpg padded to 3: frame_007.jpg.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Formats the default PNG frame name and honors an explicit extension and width.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the name formatter for frame 42 and frame 7 with separate default and custom arguments.
 * @evidence contracts/development/testing.md#independent-expectations Literal names pin five default digits and a three-digit JPEG name.
 */
export function test_render_root_frame_name(): void {
  TestValidator.equals("frame 42", AutoMovieRenderMedia.frameName(42), "frame_00042.png");
  TestValidator.equals("frame 7", AutoMovieRenderMedia.frameName(7, "jpg", 3), "frame_007.jpg");
}
