import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Quaternion angular distance measures the actual shorter rotation after
 * scalar inverse normalization, including corrections below dot resolution.
 *
 * Scenarios:
 * 1. Cardinal Z turns at170 and-170 degrees are20 degrees apart. Negating
 *    either quaternion or reversing the pair leaves that physical distance.
 * 2. X90 and Y90 are120 degrees apart; the two noncommuting products X90Y90
 *    and Y90X90 also differ by120 degrees, independently of their factor order.
 * 3. Identity versus Z turns of1e-9 and1e-5 radians retains those nonzero
 *    angles, including opposite quaternion signs. An identical rotation stays
 *    within binary64 product roundoff without an artificial correction floor.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States radians/degree expectations, shorter-arc sign equivalence, noncommuting geometry, small-angle resolution and the three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual public Quaternion.angle on literal unit endpoints and their products, checking known geodesic distances, pair/sign symmetry, preserved tiny corrections and true zero.
 * @evidence contracts/development/testing.md#independent-expectations The wrapped cardinal difference is20 degrees. X90/Y90 and their written products have absolute dot1/2, giving2acos(1/2)=120 degrees. A cardinal half-angle directly encodes each tiny input. Identity allows1e-14 radians for normalization/Hamilton product roundoff; tiny nonzero angles retain relative1e-12 agreement, so that zero bound is no deadzone.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers shortest versus long arc, either quaternion sign, reversed arguments, noncommuting axes/products, two small scales and identical rotations. Nonunit/zero/extreme normalization remains covered by existing normalization and inverse entries.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable math unit owns all finite unit endpoints and calls the real angle function without a host, compiler, foreign replacement or new public helper.
 */
export function test_math_quaternion_geodesic_semantics(): void {
  const a: IAutoMovieQuaternion = zturn(170 * Math.PI / 180);
  const b: IAutoMovieQuaternion = zturn(-170 * Math.PI / 180);
  for (const [left, right] of [[a, b], [b, a], [negative(a), b], [a, negative(b)]] as const)
    TestValidator.predicate("cardinal distance uses the shorter physical arc",
      nclose(Quaternion.angle(left, right), Math.PI / 9, 1e-12),
    );
  const x: IAutoMovieQuaternion = { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 };
  const y: IAutoMovieQuaternion = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
  TestValidator.predicate("different cardinal quarter-turn axes have the known geodesic",
    nclose(Quaternion.angle(x, y), 2 * Math.PI / 3, 1e-12),
  );
  const xy: IAutoMovieQuaternion = { x: 0.5, y: 0.5, z: 0.5, w: 0.5 };
  const yx: IAutoMovieQuaternion = { x: 0.5, y: 0.5, z: -0.5, w: 0.5 };
  TestValidator.predicate("noncommuting composed rotations retain their actual separation",
    nclose(Quaternion.angle(xy, yx), 2 * Math.PI / 3, 1e-12),
  );
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  for (const radians of [1e-9, 1e-5])
    for (const rotation of [zturn(radians), negative(zturn(radians))])
      TestValidator.predicate("small representable orientation corrections remain nonzero",
        nclose(Quaternion.angle(identity, rotation), radians, radians * 1e-12),
      );
  TestValidator.predicate("identical physical rotations have no minimum-angle floor",
    nclose(Quaternion.angle(a, a), 0, 1e-14) && nclose(Quaternion.angle(a, negative(a)), 0, 1e-14),
  );
}

/** Encode a cardinal rotation directly in radians using its half-angle. */
function zturn(radians: number): IAutoMovieQuaternion {
  return { x: 0, y: 0, z: Math.sin(radians / 2), w: Math.cos(radians / 2) };
}

/** Select the other quaternion representation of the same physical rotation. */
function negative(value: IAutoMovieQuaternion): IAutoMovieQuaternion {
  return { x: -value.x, y: -value.y, z: -value.z, w: -value.w };
}
