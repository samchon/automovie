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