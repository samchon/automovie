import { AutoMovieEngineQuaternion, AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, qclose, qunit, vclose } from "../../internal/predicates";

/**
 * `lookRotation` maps the camera's local -Z onto the requested direction and
 * keeps local X horizontal away from the vertical degeneracy.
 *
 * Scenarios:
 *
 * 1. For ahead (-Z), behind (+Z), the sides (+-X) and four compound diagonals, the
 *    rotation is a unit quaternion, sends -Z onto the normalized direction and
 *    keeps local X level (y component 0 within 1e-9).
 * 2. Straight ahead is the identity (w = 1).
 * 3. Straight down and straight up have free roll, so only the forward mapping is
 *    checked.
 * 4. A zero direction gives the identity, not a camera rolled upside down.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify the forward mapping, horizontal roll convention, vertical degeneracy, and straight-ahead and zero-vector identities.
 * @evidence contracts/development/testing.md#behavioral-verification The test calls lookRotation for the stated directions and applies the returned quaternion to camera axes. It compares unit length, normalized forward and admissible roll.
 * @evidence contracts/development/testing.md#independent-expectations Local forward is negative Z. The independently normalized direction must match its image, and horizontal local right requires a zero Y component off the vertical degeneracy. Vertical cases constrain just forward. Straight-ahead and zero have the authored identity result.
 */
export function test_engine_film_look_rotation(): void {
  const forward: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };
  const right: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const level: IAutoMovieVector3[] = [
    { x: 0, y: 0, z: -1 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 2.2, y: 0.33, z: -1.35 },
    { x: -1.35, y: 0.33, z: 2.2 },
    { x: 0.5, y: -0.8, z: 0.5 },
    { x: -0.5, y: 0.8, z: -0.5 },
  ];
  for (const direction of level) {
    const q: IAutoMovieQuaternion = AutoMovieEngineFilm.lookRotation(direction);
    const length: number = Math.hypot(direction.x, direction.y, direction.z);
    TestValidator.predicate(`unit ${JSON.stringify(direction)}`, qunit(q));
    TestValidator.predicate(
      `forward ${JSON.stringify(direction)}`,
      vclose(AutoMovieEngineQuaternion.rotateVector(q, forward), {
        x: direction.x / length,
        y: direction.y / length,
        z: direction.z / length,
      }),
    );
    TestValidator.predicate(
      `level ${JSON.stringify(direction)}`,
      nclose(AutoMovieEngineQuaternion.rotateVector(q, right).y, 0, 1e-9),
    );
  }
  TestValidator.predicate(
    "identity",
    nclose(AutoMovieEngineFilm.lookRotation({ x: 0, y: 0, z: -1 }).w, 1, 1e-12),
  );
  for (const direction of [
    { x: 0, y: -1, z: 0 },
    { x: 0, y: 1, z: 0 },
  ])
    TestValidator.predicate(
      `vertical ${JSON.stringify(direction)}`,
      vclose(
        AutoMovieEngineQuaternion.rotateVector(AutoMovieEngineFilm.lookRotation(direction), forward),
        direction,
      ),
    );
  TestValidator.predicate(
    "zero direction",
    qclose(AutoMovieEngineFilm.lookRotation({ x: 0, y: 0, z: 0 }), { x: 0, y: 0, z: 0, w: 1 }),
  );
}
