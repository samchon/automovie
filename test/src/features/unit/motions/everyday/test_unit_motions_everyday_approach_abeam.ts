import type { IAutoMovieVector3 } from "@automovie/interface";
import { approachAbeam } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `approachAbeam` is the waypoint a straight approach passes an obstacle
 * through: abeam of it at the passing distance, on the side the path already
 * lies, and none when the obstacle is behind the start, beyond the goal, at
 * least the passing distance aside, or the path has no length.
 *
 * Scenarios, a path from the origin to (0, 0, 4) and a passing distance of 0.5
 * m:
 *
 * 1. An obstacle at (0.2, 0, 2), 0.2 m toward +X of the path, is passed at (-0.3,
 *    0, 2), half a metre from it on the path's side.
 * 2. One at (-0.2, 0, 2) is passed at (0.3, 0, 2).
 * 3. Obstacles at (0, 0, -1), (0, 0, 5), (0.6, 0, 2) and a path of no length give
 *    none.
 */
export function test_unit_motions_everyday_approach_abeam(): void {
  const from: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const to: IAutoMovieVector3 = { x: 0, y: 0, z: 4 };
  TestValidator.equals(
    "abeam",
    [
      approachAbeam(from, to, { x: 0.2, y: 0, z: 2 }, 0.5),
      approachAbeam(from, to, { x: -0.2, y: 0, z: 2 }, 0.5),
    ],
    [
      { x: 0.2 - 0.5, y: 0, z: 2 },
      { x: -0.2 + 0.5, y: 0, z: 2 },
    ],
  );
  TestValidator.equals(
    "none",
    [
      approachAbeam(from, to, { x: 0, y: 0, z: -1 }, 0.5),
      approachAbeam(from, to, { x: 0, y: 0, z: 5 }, 0.5),
      approachAbeam(from, to, { x: 0.6, y: 0, z: 2 }, 0.5),
      approachAbeam(from, from, { x: 0, y: 0, z: 0 }, 0.5),
    ],
    [undefined, undefined, undefined, undefined],
  );
}
