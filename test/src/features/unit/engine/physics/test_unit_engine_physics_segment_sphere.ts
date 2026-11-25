import { segmentSphere } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/** Rounding of one square root, as a parameter of the segment. */
const ROUNDING: number = 1e-12;

/** A point. */
function v(x: number, y: number, z: number): IAutoMovieVector3 {
  return { x, y, z };
}

/**
 * `segmentSphere` gives the parameter in [0, 1] where a segment first meets a
 * sphere, 0 when it starts inside, and null when it never does within the
 * segment.
 *
 * Scenarios, a sphere of radius 1 at (5, 0, 0) unless stated:
 *
 * 1. The segment (0, 0, 0) to (10, 0, 0) enters at x = 4, parameter 0.4.
 * 2. Beside it, the segment 5 m aside misses; one ending at x = 1, short of the
 *    sphere, misses.
 * 3. A segment starting at the centre is inside from 0; a point segment inside a
 *    sphere at the origin is 0, one outside it null.
 * 4. A radius of 0 or -1 is refused.
 */
export function test_unit_engine_physics_segment_sphere(): void {
  const center: IAutoMovieVector3 = v(5, 0, 0);
  const entry: number | null = segmentSphere(v(0, 0, 0), v(10, 0, 0), center, 1);
  TestValidator.predicate(
    "the entry",
    entry !== null && Math.abs(entry - 0.4) <= ROUNDING,
  );
  TestValidator.equals(
    "misses and starts",
    [
      segmentSphere(v(0, 0, 0), v(10, 0, 0), v(5, 5, 0), 1),
      segmentSphere(v(0, 0, 0), v(1, 0, 0), center, 1),
      segmentSphere(v(5, 0, 0), v(10, 0, 0), center, 1),
      segmentSphere(v(0, 0, 0), v(0, 0, 0), v(0, 0, 0), 1),
      segmentSphere(v(5, 0, 0), v(5, 0, 0), v(0, 0, 0), 1),
    ],
    [null, null, 0, 0, null],
  );
  for (const radius of [0, -1])
    TestValidator.predicate(
      `radius ${radius}`,
      throwsError(() => segmentSphere(v(0, 0, 0), v(10, 0, 0), center, radius)),
    );
}
