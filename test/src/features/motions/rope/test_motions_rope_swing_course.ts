import { AutoMovieGravity } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { ropeSwingCourse } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * Sixty-four binary64 rounding units cover the composed trigonometry at a 7 m
 * scale.
 */
const ROUNDING: number = 64 * Number.EPSILON * 7;

/**
 * A stage pendulum preserves its radius and reaches both extreme marks at rest.
 *
 * Scenarios:
 *
 * 1. The −30 degree start 2 m from the anchor reaches the reflected extreme after
 *    π√(2/g) s. The world +X coordinate stays at the anchor's x.
 * 2. Halfway between those times the figure lies directly below the anchor and has
 *    a purely forward tangent of (π/6)√(2g) m/s. Reading the later extreme
 *    first does not change an earlier query.
 */
export function test_motions_rope_swing_course(): void {
  const anchor: IAutoMovieVector3 = { x: 3, y: 4, z: 5 };
  const entered: IAutoMovieVector3 = { x: 3, y: 4 - Math.sqrt(3), z: 4 };
  const course: ropeSwingCourse.ICourse = ropeSwingCourse(
    anchor,
    { x: 0, y: 0, z: 1 },
    entered,
  );
  const half: number = Math.PI * Math.sqrt(2 / AutoMovieGravity.STANDARD);
  const tangent: number =
    (Math.PI / 6) * Math.sqrt(2 * AutoMovieGravity.STANDARD);
  TestValidator.predicate(
    "both extremes have the declared period and zero tangent",
    nclose(course.half, half, ROUNDING) &&
      vclose(course.at(half), { ...entered, z: 6 }, ROUNDING) &&
      vclose(course.velocity(half), { x: 0, y: 0, z: 0 }, ROUNDING) &&
      vclose(course.at(0), entered, ROUNDING) &&
      vclose(course.velocity(0), { x: 0, y: 0, z: 0 }, ROUNDING),
  );
  TestValidator.predicate(
    "the bottom point has a horizontal tangent toward the landing",
    vclose(course.at(half / 2), { ...anchor, y: 2 }, ROUNDING) &&
      vclose(course.velocity(half / 2), { x: 0, y: 0, z: tangent }, ROUNDING),
  );
}
