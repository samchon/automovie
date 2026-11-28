import { AutoMovieEngineFilm } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `sectionPlaneDistance` is the signed distance of a point from a
 * section plane along its normal, whatever the normal's length; a zero normal
 * is refused.
 *
 * Scenarios, plane through (0, 1, 0) with normal (0, 2, 0):
 *
 * 1. (3, 4, 5) is 3 above it, (0, -1, 7) is 2 below, and (9, 1, 9) is on it.
 * 2. A zero normal is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios specify signed distance on both sides and on the plane, with a non-unit and a zero normal.
 * @evidence contracts/development/testing.md#behavioral-verification The test calls the plane-distance owner with the authored plane and three points and compares exact signed values, then calls it with a zero normal.
 * @evidence contracts/development/testing.md#independent-expectations The plane is y = 1 and its normalized positive Y normal leaves distances 4 minus 1, -1 minus 1 and 1 minus 1. The magnitude two cancels when normalizing. The zero vector cannot define a direction.
 */
export function test_engine_film_section_plane_distance(): void {
  const plane = { point: { x: 0, y: 1, z: 0 }, normal: { x: 0, y: 2, z: 0 } };
  TestValidator.equals(
    "signed distances along the normal",
    [
      AutoMovieEngineFilm.autoMovieSectionPlaneDistance(plane, { x: 3, y: 4, z: 5 }),
      AutoMovieEngineFilm.autoMovieSectionPlaneDistance(plane, { x: 0, y: -1, z: 7 }),
      AutoMovieEngineFilm.autoMovieSectionPlaneDistance(plane, { x: 9, y: 1, z: 9 }),
    ],
    [3, -2, 0],
  );
  TestValidator.predicate(
    "a zero normal is refused",
    throwsError(
      () =>
        AutoMovieEngineFilm.autoMovieSectionPlaneDistance(
          { point: plane.point, normal: { x: 0, y: 0, z: 0 } },
          plane.point,
        ),
      "non-zero",
    ),
  );
}
