import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  kneelPlace
} from "../../../../../packages/motions/src/everyday/internal/kneelPlace";
import { TestValidator } from "@nestia/e2e";

/**
 * How far a placed hip may stand from its hand-computed point, metres: a few
 * additions of decimetre values, far above their rounding.
 */
const PLACE: number = 1e-12;

/**
 * The kneeling hip comes to rest behind the front ankle by the reverse lunge's
 * distance, or over a named knee point that leaves the front leg in reach and
 * the hip at least that distance behind the front ankle.
 *
 * Scenarios, for a 0.4 m thigh and shank, a front ankle at (0.1, 0.08, 0), a
 * heading of +z, a reverse lunge 0.3 m behind and a kneeling hip 0.5 m high:
 *
 * 1. Without a point, a hip standing at z = -0.2 moves to 0.3 m behind the ankle,
 *    (-0.1, 0.5, -0.3).
 * 2. A point 0.5 m behind keeps the front ankle 0.653 m from its hip, within the
 *    0.8 m leg, and the hip lands over it.
 * 3. A point exactly 0.3 m behind is kept.
 * 4. A point level with the front foot, kneeling where one stands, is refused: the
 *    front knee would fold forward of its foot toward whoever stands in front.
 * 5. A point 0.9 m behind leaves the front ankle 0.993 m from its hip and is
 *    refused.
 */
export function test_motions_everyday_kneel_place(): void {
  const place = (at?: IAutoMovieVector3): IAutoMovieVector3 =>
    kneelPlace({
      body: { measure: { thigh: 0.4, shank: 0.4 } },
      hip: { x: -0.1, y: 0.9, z: -0.2 },
      front: { x: 0.1, y: 0.08, z: 0 },
      forward: { x: 0, y: 0, z: 1 },
      behind: 0.3,
      height: 0.5,
      across: { x: 0.2, y: 0, z: 0 },
      ...(at !== undefined ? { at } : {}),
    });
  const near = (actual: IAutoMovieVector3, expected: IAutoMovieVector3) =>
    Math.abs(actual.x - expected.x) <= PLACE &&
    Math.abs(actual.y - expected.y) <= PLACE &&
    Math.abs(actual.z - expected.z) <= PLACE;

  TestValidator.predicate(
    "the reverse lunge's hip stands its distance behind the front ankle",
    near(place(), { x: -0.1, y: 0.5, z: -0.3 }),
  );
  TestValidator.predicate(
    "a reachable point behind the front foot holds the hip",
    near(place({ x: -0.1, y: 0, z: -0.5 }), { x: -0.1, y: 0.5, z: -0.5 }),
  );
  TestValidator.predicate(
    "a point exactly the lunge's distance behind is kept",
    near(place({ x: -0.1, y: 0, z: -0.3 }), { x: -0.1, y: 0.5, z: -0.3 }),
  );
  TestValidator.error("kneeling level with the front foot is refused", () =>
    place({ x: -0.1, y: 0, z: 0 }),
  );
  TestValidator.error("a point beyond the front leg's reach is refused", () =>
    place({ x: -0.1, y: 0, z: -0.9 }),
  );
}
