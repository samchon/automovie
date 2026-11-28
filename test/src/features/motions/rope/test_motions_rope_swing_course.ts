import { AutoMovieEngineGravity } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  ropeSwingCourse
} from "../../../../../packages/motions/src/rope/internal/ropeSwingCourse";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * Sixty-four binary64 rounding units cover the composed trigonometry at a 7 m
 * scale.
 */
const ROUNDING: number = 64 * Number.EPSILON * 7;

/**
 * Check a staged swing's mirrored endpoints and midpoint tangent.
 *
 * Scenarios:
 *
 * 1. Start at -30 degrees on a two-metre radius. Reach the reflected extreme
 *    after `pi * sqrt(2 / g)` seconds, with both extremes at rest.
 * 2. At half that time the point lies below the anchor with forward tangent
 *    speed `(pi / 6) * sqrt(2 * g)` . Read the earlier values after the later
 *    one.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases give radius, endpoint order and centre-crossing velocity.
 * @evidence contracts/development/testing.md#behavioral-verification The swing course supplies position and velocity at the two extremes and the middle.
 * @evidence contracts/development/testing.md#independent-expectations The specified harmonic swing gives the half-period. Its angular amplitude times angular frequency and radius gives the tangent.
 */
export function test_motions_rope_swing_course(): void {
  const anchor: IAutoMovieVector3 = { x: 3, y: 4, z: 5 };
  const entered: IAutoMovieVector3 = { x: 3, y: 4 - Math.sqrt(3), z: 4 };
  const course: ropeSwingCourse.ICourse = ropeSwingCourse(
    anchor,
    { x: 0, y: 0, z: 1 },
    entered,
  );
  const half: number = Math.PI * Math.sqrt(2 / AutoMovieEngineGravity.STANDARD);
  const tangent: number =
    (Math.PI / 6) * Math.sqrt(2 * AutoMovieEngineGravity.STANDARD);
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
