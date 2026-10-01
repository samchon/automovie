import { TestValidator } from "@nestia/e2e";

import { rasterizeEyelashSegment } from "../../../scripts/face-review/rasterizeEyelashSegment";
import { nclose } from "../internal/predicates";

/**
 * Continuous subpixel fibre coverage is the area of a tapered strip inside
 * each unit pixel. Expected area comes from rectangle/trapezoid geometry,
 * independent of the rasterizer's clipping or sampling phase.
 *
 * Scenarios:
 * 1. A horizontal 4.5px strip of width0.2 covers0.9 square pixels.
 * 2. A vertical strip on an integer x boundary covers both neighbouring
 *    columns continuously; translations within a pixel preserve total area.
 * 3. A 4px strip tapering from width1 to0 has area2; two adjacent pieces
 *    accumulate to the same coverage as the whole strip.
 * 4. A diagonal strip preserves length-times-width area and pixel bounds;
 *    clipping at the image edge accounts for the exact retained area.
 * 5. Zero length, zero width and an entirely out-of-image strip add nothing.
 */
export const test_subject_eyelash_segment_coverage = (): void => {
  const raster = (start: [number, number], end: [number, number],
    widthStart: number, widthEnd = widthStart, size = 6): Map<number, number> => {
    const coverage = new Map<number, number>();
    rasterizeEyelashSegment({ start, end, widthStart, widthEnd, size, coverage });
    return coverage;
  };
  const area = (coverage: Map<number, number>): number =>
    [...coverage.values()].reduce((sum, value) => sum + value, 0);
  const horizontal = raster([0.25, 1.3], [4.75, 1.3], 0.2);
  TestValidator.predicate("horizontal subpixel rectangle area",
    nclose(area(horizontal), 0.9, 1e-12) && nclose(horizontal.get(7) ?? 0, 0.2, 1e-12));
  for (const phase of [0, 0.2, 0.4, 0.6, 0.8]) {
    const vertical = raster([1 + phase, 0.2], [1 + phase, 4.8], 0.2);
    TestValidator.predicate("vertical phase preserves physical coverage",
      nclose(area(vertical), 0.92, 1e-12));
    for (let y = 0; y <= 4; ++y)
      TestValidator.predicate("positive fibre crosses every intermediate row",
        [...vertical].some(([pixel, value]) => Math.floor(pixel / 6) === y && value > 0));
  }
  const whole = raster([1, 1.5], [5, 1.5], 1, 0);
  const split = raster([1, 1.5], [3, 1.5], 1, 0.5);
  rasterizeEyelashSegment({ start: [3, 1.5], end: [5, 1.5],
    widthStart: 0.5, widthEnd: 0, size: 6, coverage: split });
  TestValidator.predicate("tapered area and split pieces agree",
    nclose(area(whole), 2, 1e-12) && nclose(area(split), 2, 1e-12) &&
    [...whole].every(([pixel, value]) => nclose(split.get(pixel) ?? 0, value, 1e-12)));
  const diagonal = raster([0.7, 0.7], [2.7, 2.7], 0.1, 0.1, 4);
  TestValidator.predicate("diagonal strip integrates its actual area",
    nclose(area(diagonal), 2 * Math.sqrt(2) * 0.1, 1e-12) &&
    [...diagonal].every(([pixel, value]) => pixel >= 0 && pixel < 16 && value > 0 && value <= 1));
  TestValidator.predicate("image clipping retains the exact area",
    nclose(area(raster([-1, 1], [3, 1], 0.5, 0.5, 2)), 1, 1e-12));
  TestValidator.equals("zero length", raster([1, 1], [1, 1], 1).size, 0);
  TestValidator.equals("zero width", raster([1, 1], [3, 1], 0).size, 0);
  TestValidator.equals("outside image", raster([-3, -3], [-2, -2], 0.1).size, 0);
};
