import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/predicates";

/**
 * `Quaternion` composes, inverts, interpolates and applies rotations; each case
 * is a hand-computed rotation of a unit axis.
 *
 * Scenarios:
 *
 * 1. `multiply` follows Hamilton's rule: i * j = k, j * i = -k, i * i = -1.
 * 2. `fromAxisAngle` of 90 degrees about z is (0, 0, sqrt(1/2), sqrt(1/2)).
 * 3. `rotateVector` turns (1, 0, 0) into (0, 1, 0) by that quarter turn, and
 *    `rotateVectorY` reads the y component of the rotated vector.
 * 4. `inverse` of the quarter turn composed with it gives the identity.
 * 5. `slerp` halfway between the identity and the quarter turn is 45 degrees about
 *    z: (0, 0, sin 22.5, cos 22.5).
 * 6. `angle` between the identity and the quarter turn is pi / 2 either way, and
 *    `angleAfterNormalize` agrees for unit inputs.
 * 7. `normalize` scales (0, 0, 0, 2) to the identity.
 */
export function test_unit_engine_math_quaternion(): void {
  const q = (
    x: number,
    y: number,
    z: number,
    w: number,
  ): IAutoMovieQuaternion => ({ x, y, z, w });
  const same = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): boolean =>
    nclose(a.x, b.x, 1e-12) &&
    nclose(a.y, b.y, 1e-12) &&
    nclose(a.z, b.z, 1e-12) &&
    nclose(a.w, b.w, 1e-12);
  const h: number = Math.SQRT1_2;
  const identity: IAutoMovieQuaternion = q(0, 0, 0, 1);

  // 1.
  TestValidator.equals(
    "ij",
    Quaternion.multiply(q(1, 0, 0, 0), q(0, 1, 0, 0)),
    q(0, 0, 1, 0),
  );
  TestValidator.equals(
    "ji",
    Quaternion.multiply(q(0, 1, 0, 0), q(1, 0, 0, 0)),
    q(0, 0, -1, 0),
  );
  TestValidator.equals(
    "ii",
    Quaternion.multiply(q(1, 0, 0, 0), q(1, 0, 0, 0)),
    q(0, 0, 0, -1),
  );

  // 2.
  const quarter: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    90,
  );
  TestValidator.predicate("axis angle", same(quarter, q(0, 0, h, h)));

  // 3.
  const turned: IAutoMovieVector3 = Quaternion.rotateVector(quarter, {
    x: 1,
    y: 0,
    z: 0,
  });
  TestValidator.predicate(
    "rotate",
    nclose(turned.x, 0, 1e-12) &&
      nclose(turned.y, 1, 1e-12) &&
      nclose(turned.z, 0, 1e-12),
  );
  TestValidator.predicate(
    "rotate y",
    nclose(Quaternion.rotateVectorY(quarter, { x: 1, y: 0, z: 0 }), 1, 1e-12),
  );

  // 4.
  TestValidator.predicate(
    "inverse",
    same(Quaternion.multiply(Quaternion.inverse(quarter), quarter), identity),
  );

  // 5.
  const half: IAutoMovieQuaternion = Quaternion.slerp(identity, quarter, 0.5);
  TestValidator.predicate(
    "slerp",
    same(half, q(0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8))),
  );

  // 6.
  TestValidator.predicate(
    "angle",
    nclose(Quaternion.angle(identity, quarter), Math.PI / 2, 1e-12),
  );
  TestValidator.predicate(
    "angle reversed",
    nclose(Quaternion.angle(quarter, identity), Math.PI / 2, 1e-12),
  );
  TestValidator.predicate(
    "angle after normalize",
    nclose(
      Quaternion.angleAfterNormalize(identity, quarter),
      Math.PI / 2,
      1e-12,
    ),
  );

  // 7.
  TestValidator.predicate(
    "normalize",
    same(Quaternion.normalize(q(0, 0, 0, 2)), identity),
  );
}
