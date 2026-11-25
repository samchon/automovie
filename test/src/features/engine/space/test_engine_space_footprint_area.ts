import { footprintArea } from "@automovie/engine";
import type { IAutoMovieFootprintRing } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `footprintArea` is the outer ring's area less its holes', read from each
 * ring's cached double area of either winding.
 *
 * Scenarios:
 *
 * 1. Outer double area −24 (a clockwise 4 × 3) with a hole of double area 2: 12 −
 *    1 = 11 m².
 * 2. No hole: the outer area alone.
 */
export function test_engine_space_footprint_area(): void {
  const ring: (doubleArea: number) => IAutoMovieFootprintRing = (
    doubleArea: number,
  ): IAutoMovieFootprintRing => ({
    points: [],
    plan: [],
    doubleArea,
  });
  TestValidator.equals(
    "a ring with a hole",
    footprintArea({ outer: ring(-24), holes: [ring(2)] }),
    11,
  );
  TestValidator.equals(
    "no hole",
    footprintArea({ outer: ring(24), holes: [] }),
    12,
  );
}
