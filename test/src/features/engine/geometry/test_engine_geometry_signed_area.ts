import { polygonDoubleArea, signedArea } from "@automovie/engine";
import type { IAutoMoviePlanarPoint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Planar area retains its magnitude and winding when a ring is translated.
 *
 * Scenarios:
 *
 * 1. Unit squares at the origin and at offsets of 1e8 and 1e12 have area 1 m²
 *    counter-clockwise and -1 m² clockwise. The doubled area is ±2 m².
 * 2. Rings with fewer than three corners and a collinear ring have zero area.
 * 3. A thin rectangle spanning both binary64 extremes has finite area even when
 *    its width alone would overflow.
 */
export function test_engine_geometry_signed_area(): void {
  for (const offset of [0, 1e8, 1e12]) {
    const square: IAutoMoviePlanarPoint[] = [
      { x: offset, y: offset },
      { x: offset + 1, y: offset },
      { x: offset + 1, y: offset + 1 },
      { x: offset, y: offset + 1 },
    ];
    const clockwise: IAutoMoviePlanarPoint[] = [...square].reverse();
    TestValidator.predicate(
      `signed area at ${offset}`,
      nclose(signedArea(square), 1, 0) && nclose(signedArea(clockwise), -1, 0),
    );
    TestValidator.predicate(
      `twice the signed area at ${offset}`,
      nclose(polygonDoubleArea(square), 2, 0) &&
        nclose(polygonDoubleArea(clockwise), -2, 0),
    );
  }

  const line: IAutoMoviePlanarPoint[] = [
    { x: 1e12, y: 1e12 },
    { x: 1e12 + 1, y: 1e12 + 1 },
    { x: 1e12 + 2, y: 1e12 + 2 },
  ];
  for (const ring of [[], line.slice(0, 1), line.slice(0, 2), line])
    TestValidator.predicate(
      `zero area with ${ring.length} corners`,
      nclose(signedArea(ring), 0, 0) && nclose(polygonDoubleArea(ring), 0, 0),
    );

  const thin: IAutoMoviePlanarPoint[] = [
    { x: -1e308, y: -1e-308 },
    { x: 1e308, y: -1e-308 },
    { x: 1e308, y: 1e-308 },
    { x: -1e308, y: 1e-308 },
  ];
  TestValidator.predicate(
    "opposite extremes retain a finite signed and doubled area",
    nclose(signedArea(thin), 4, 1e-12) &&
      nclose(polygonDoubleArea(thin), 8, 1e-12),
  );
}
