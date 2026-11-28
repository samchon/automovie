import {
  markCaptureCell
} from "../../../../../packages/render/src/capture/internal/markCaptureCell";
import { TestValidator } from "@nestia/e2e";

/**
 * `markCaptureCell` fills a cell with the opaque mark colour.
 *
 * Scenarios:
 *
 * 1. A 2 by 3 cell has 6 pixels of (96, 16, 16, 255).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines a shape-preserving opaque mark for each pixel of a capture cell.
 * @evidence contracts/development/testing.md#behavioral-verification Marks a 2-by-3 cell and inspects its dimensions and raw bytes.
 * @evidence contracts/development/testing.md#independent-expectations Two times three gives six distinct pixels and each must have the fixed RGBA bytes (96, 16, 16, 255).
 */
export function test_render_capture_mark_capture_cell(): void {
  const image: { width: number; height: number; pixels: Uint8ClampedArray } =
    markCaptureCell({ width: 2, height: 3 });
  TestValidator.equals("size", [image.width, image.height], [2, 3]);
  TestValidator.equals(
    "pixels",
    [...image.pixels],
    new Array<number>(6).fill(0).flatMap((): number[] => [96, 16, 16, 255]),
  );
}