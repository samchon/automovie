import { TestValidator } from "@nestia/e2e";
import { composeHumanViewerPixels } from "../../../scripts/human-viewer/composeHumanViewerPixels";

/**
 * Pair and difference pixels have independent, exact expectations.
 * Scenarios:
 * 1. Two one-pixel columns across two rows keep their source bytes and absolute difference.
 * 2. Identical images have a zero RGB map with opaque alpha.
 * 3. Nonpositive, fractional and incompatible dimensions refuse.
 */
export function test_human_viewer_pixel_comparison(): void {
  const a = new Uint8Array([10, 20, 30, 128, 100, 0, 255, 255]);
  const b = new Uint8Array([30, 15, 25, 255, 0, 10, 200, 128]);
  const result = composeHumanViewerPixels(1, 2, a, b);
  TestValidator.equals("dimensions", [result.width, result.height], [3, 2]);
  TestValidator.equals("pixels", Array.from(result.data), [10, 20, 30, 128, 30, 15, 25, 255, 20, 5, 5, 255,
    100, 0, 255, 255, 0, 10, 200, 128, 100, 10, 55, 255]);
  TestValidator.equals("unchanged", Array.from(a), [10, 20, 30, 128, 100, 0, 255, 255]);
  TestValidator.equals("identical difference", Array.from(composeHumanViewerPixels(1, 2, a, a).data).slice(-4), [0, 0, 0, 255]);
  for (const [width, height, first, second] of [[0, 2, a, b], [1.5, 2, a, b], [1, -2, a, b], [1, 1, a, b], [1, 2, a, new Uint8Array(4)]] as const) {
    let refused = false;
    try { composeHumanViewerPixels(width, height, first, second); } catch { refused = true; }
    TestValidator.predicate("incompatible", refused);
  }
}
