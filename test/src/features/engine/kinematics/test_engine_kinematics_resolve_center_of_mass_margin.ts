
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** Rounding of one hull edge distance, metres. */
const ROUNDING: number = 1e-12;

/**
 * `AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassMargin` is Hof's margin of stability: the
 * horizontal distance from a point to the nearest edge of the support's convex
 * hull on the floor plane (x, z), positive inside and negative outside (Hof,
 * Gazendam and Sinke 2005).
 *
 * The support is the unit square [0, 1] x [0, 1] in x and z, given out of order
 * with an interior point and heights, so a margin read without the hull or with
 * the height fails.
 *
 * Scenarios:
 *
 * 1. The square's centre at any height is 0.5 m inside.
 * 2. A point a quarter metre beyond the far edge is -0.25 m.
 * 3. A point on an edge is 0.
 * 4. Two support points are a segment, no area: a point on it is no margin and a
 *    point beside it is outside by its distance.
 * 5. No support point is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers signed support margins in XZ, zero on the boundary, degenerate support and empty-input refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Calls resolveAutoMovieCenterOfMassMargin on an unordered square with extra heights and an interior support point, then on a segment and an empty support.
 * @evidence contracts/development/testing.md#independent-expectations The square centre is half a metre from its nearest edge. One point is a quarter metre outside and an exact edge point has zero margin. A segment has no interior area.
 */
export function test_engine_kinematics_resolve_center_of_mass_margin(): void {
  const square: IAutoMovieVector3[] = [
    { x: 1, y: 0.2, z: 1 },
    { x: 0, y: 0, z: 0 },
    { x: 0.5, y: 0, z: 0.4 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0.1, z: 1 },
  ];
  const margin: typeof AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassMargin =
    AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassMargin;

  TestValidator.predicate(
    "the centre at any height",
    nclose(margin({ x: 0.5, y: 0, z: 0.5 }, square), 0.5, ROUNDING) &&
      nclose(margin({ x: 0.5, y: 3, z: 0.5 }, square), 0.5, ROUNDING),
  );
  TestValidator.predicate(
    "beyond the far edge",
    nclose(margin({ x: 0.5, y: 0, z: 1.25 }, square), -0.25, ROUNDING),
  );
  TestValidator.predicate(
    "on an edge",
    nclose(margin({ x: 1, y: 0, z: 0.3 }, square), 0, ROUNDING),
  );
  const segment: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  ];
  TestValidator.predicate(
    "a segment has no inside",
    nclose(margin({ x: 0.5, y: 0, z: 0 }, segment), 0, ROUNDING) &&
      nclose(margin({ x: 0.5, y: 0, z: 0.2 }, segment), -0.2, ROUNDING),
  );
  TestValidator.predicate(
    "no support is refused",
    throwsError(() => margin({ x: 0, y: 0, z: 0 }, [])),
  );
}
