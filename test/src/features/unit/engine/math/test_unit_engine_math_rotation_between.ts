import { rotationBetween } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../internal/qclose";

/**
 * `rotationBetween` is the shortest rotation turning one direction onto
 * another, regardless of their lengths; opposite directions turn half a turn
 * about an axis perpendicular to them, and `prepare` fixes the source.
 *
 * Scenarios:
 *
 * 1. +X onto +Y, from any lengths, is a quarter turn about +Z:
 *    (0, 0, sqrt(1/2), sqrt(1/2)).
 * 2. A direction onto itself is the identity.
 * 3. +X onto -X turns half about +X × +Y = +Z, (0, 0, 1, 0); +Y onto -Y, whose x
 *    is small, turns half about +Y × +X = -Z, (0, 0, -1, 0).
 * 4. A prepared +X source gives the same quarter turn onto +Y.
 */
export function test_unit_engine_math_rotation_between(): void {
  const x: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const y: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const quarter: IAutoMovieQuaternion = {
    x: 0,
    y: 0,
    z: Math.SQRT1_2,
    w: Math.SQRT1_2,
  };
  TestValidator.predicate(
    "a quarter turn from any lengths",
    qclose(rotationBetween({ x: 2, y: 0, z: 0 }, { x: 0, y: 5, z: 0 }), quarter, 1e-12),
  );
  TestValidator.predicate(
    "a direction onto itself is the identity",
    qclose(rotationBetween(x, x), { x: 0, y: 0, z: 0, w: 1 }, 1e-12),
  );
  TestValidator.predicate(
    "opposite directions turn half about a perpendicular",
    qclose(rotationBetween(x, { x: -1, y: 0, z: 0 }), { x: 0, y: 0, z: 1, w: 0 }, 1e-12) &&
      qclose(rotationBetween(y, { x: 0, y: -1, z: 0 }), { x: 0, y: 0, z: -1, w: 0 }, 1e-12),
  );
  TestValidator.predicate(
    "a prepared source gives the same turn",
    qclose(rotationBetween.prepare(x)(y), quarter, 1e-12),
  );
}
