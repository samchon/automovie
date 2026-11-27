import type { AutoMovieVector2Tuple } from "@automovie/interface";
import { AutoMovieRecoveryGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * `signedArea` is a polygon's shoelace area, positive counter-clockwise.
 *
 * Scenarios:
 *
 * 1. The unit square has area 1 counter-clockwise and -1 clockwise, even at
 *    offsets of 1e8 and 1e12 in its contour plane.
 * 2. The right triangle (0, 0), (4, 0), (0, 3) is 6.
 * 3. Fewer than three points enclose 0.
 */
export function test_recovery_internal_signed_area(): void {
  for (const offset of [0, 1e8, 1e12]) {
    const square: AutoMovieVector2Tuple[] = [
      [offset, offset],
      [offset + 1, offset],
      [offset + 1, offset + 1],
      [offset, offset + 1],
    ];
    TestValidator.predicate(
      `contour winding at ${offset}`,
      nclose(AutoMovieRecoveryGeometry.signedArea(square), 1, 0) &&
        nclose(AutoMovieRecoveryGeometry.signedArea([...square].reverse()), -1, 0),
    );
  }

  TestValidator.predicate(
    "triangle area",
    nclose(
      AutoMovieRecoveryGeometry.signedArea([
        [0, 0],
        [4, 0],
        [0, 3],
      ]),
      6,
      0,
    ),
  );
  TestValidator.predicate(
    "short contour area",
    nclose(
      AutoMovieRecoveryGeometry.signedArea([
        [0, 0],
        [1, 1],
      ]),
      0,
      0,
    ),
  );
}
