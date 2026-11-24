import { triangulateAutoMoviePolygon } from "@automovie/engine";
import type { IAutoMoviePlanarPoint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** Rounding of a few areas of small integers. */
const ROUNDING: number = 1e-12;

/** Unit-square corners, counter-clockwise. */
const SQUARE: IAutoMoviePlanarPoint[] = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

/** An L of area 3 (three unit cells), counter-clockwise and concave. */
const ELL: IAutoMoviePlanarPoint[] = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 2, y: 1 },
  { x: 1, y: 1 },
  { x: 1, y: 2 },
  { x: 0, y: 2 },
];

/** Sum of the triangles' unsigned areas. */
const area: (
  polygon: readonly IAutoMoviePlanarPoint[],
  triangles: Array<[number, number, number]>,
) => number = (
  polygon: readonly IAutoMoviePlanarPoint[],
  triangles: Array<[number, number, number]>,
): number =>
  triangles.reduce(
    (sum: number, [i, j, k]: [number, number, number]): number =>
      sum +
      Math.abs(
        (polygon[j]!.x - polygon[i]!.x) * (polygon[k]!.y - polygon[i]!.y) -
          (polygon[j]!.y - polygon[i]!.y) * (polygon[k]!.x - polygon[i]!.x),
      ) /
        2,
    0,
  );

/**
 * `triangulateAutoMoviePolygon` splits a simple polygon into n - 2 triangles of
 * corner indices that together cover its area.
 *
 * Scenarios:
 *
 * 1. A unit square gives 2 triangles of total area 1, in either winding.
 * 2. A concave L of 6 corners gives 4 triangles of total area 3.
 * 3. A triangle gives itself.
 * 4. Fewer than 3 corners is refused.
 */
export function test_unit_engine_drawing_triangulate_polygon(): void {
  const square: Array<[number, number, number]> =
    triangulateAutoMoviePolygon(SQUARE);
  const reversed: Array<[number, number, number]> = triangulateAutoMoviePolygon(
    [...SQUARE].reverse(),
  );
  TestValidator.predicate(
    "a square in both windings",
    square.length === 2 &&
      reversed.length === 2 &&
      nclose(area(SQUARE, square), 1, ROUNDING) &&
      nclose(area([...SQUARE].reverse(), reversed), 1, ROUNDING),
  );
  const ell: Array<[number, number, number]> = triangulateAutoMoviePolygon(ELL);
  TestValidator.predicate(
    "a concave L",
    ell.length === 4 && nclose(area(ELL, ell), 3, ROUNDING),
  );
  TestValidator.equals(
    "a triangle",
    triangulateAutoMoviePolygon(SQUARE.slice(0, 3)).length,
    1,
  );
  TestValidator.predicate(
    "two corners",
    throwsError(
      () => triangulateAutoMoviePolygon(SQUARE.slice(0, 2)),
      "at least 3 corners",
    ),
  );
}
