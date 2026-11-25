import { autoMovieSectionPlaneDistance } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `autoMovieSectionPlaneDistance` is the signed distance of a point from a
 * section plane along its normal, whatever the normal's length; a zero normal
 * is refused.
 *
 * Scenarios, plane through (0, 1, 0) with normal (0, 2, 0):
 *
 * 1. (3, 4, 5) is 3 above it, (0, -1, 7) is 2 below, and (9, 1, 9) is on it.
 * 2. A zero normal is refused.
 */
export function test_engine_film_section_plane_distance(): void {
  const plane = { point: { x: 0, y: 1, z: 0 }, normal: { x: 0, y: 2, z: 0 } };
  TestValidator.equals(
    "signed distances along the normal",
    [
      autoMovieSectionPlaneDistance(plane, { x: 3, y: 4, z: 5 }),
      autoMovieSectionPlaneDistance(plane, { x: 0, y: -1, z: 7 }),
      autoMovieSectionPlaneDistance(plane, { x: 9, y: 1, z: 9 }),
    ],
    [3, -2, 0],
  );
  TestValidator.predicate(
    "a zero normal is refused",
    throwsError(
      () =>
        autoMovieSectionPlaneDistance(
          { point: plane.point, normal: { x: 0, y: 0, z: 0 } },
          plane.point,
        ),
      "non-zero",
    ),
  );
}
