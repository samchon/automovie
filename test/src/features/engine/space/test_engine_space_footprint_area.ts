import { AutoMovieEngineSpace } from "@automovie/engine";
import type { IAutoMovieFootprintRing } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Plan area uses the prepared rings' signed double areas. A negative outer
 * area and a positive hole still yield the outer area less the hole. A
 * positive outer area with no holes yields its full area.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names cached double area as the input and distinguishes an outer ring with a hole from one without holes.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `footprintArea` with typed ring records and exact equality. Empty point arrays isolate consumption of the cached area from ring preparation.
 * @evidence contracts/development/testing.md#independent-expectations A signed double area of -24 represents a 12 m² outer ring. The hole's double area of 2 represents 1 m², leaving 11 m². The positive double area of 24 with no hole gives 12 m².
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
    AutoMovieEngineSpace.footprintArea({ outer: ring(-24), holes: [ring(2)] }),
    11,
  );
  TestValidator.equals(
    "no hole",
    AutoMovieEngineSpace.footprintArea({ outer: ring(24), holes: [] }),
    12,
  );
}
