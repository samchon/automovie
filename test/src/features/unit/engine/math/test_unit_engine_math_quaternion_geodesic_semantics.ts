import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * Quaternion angular distance measures the actual shorter rotation after scalar
 * inverse normalization, including corrections below dot resolution.
 *
 * Scenarios:
 *
 * 1. Cardinal Z turns at170 and-170 degrees are20 degrees apart. Negating either
 *    quaternion or reversing the pair leaves that physical distance.
 * 2. X90 and Y90 are120 degrees apart; the two noncommuting products X90Y90 and
 *    Y90X90 also differ by120 degrees, independently of their factor order.
 * 3. Identity versus Z turns of1e-9 and1e-5 radians retains those nonzero angles,
 *    including opposite quaternion signs. An identical rotation stays within
 *    binary64 product roundoff without an artificial correction floor.
 * 4. The scalar world-Y observation of (2,3,5) retains the actual cardinal and
 *    noncommuting rotations: X90 gives-5, Y90 gives3, X90Y90 gives2 and Y90X90
 *    gives-5. Opposite quaternion signs retain each ordinate.
 * 5. The explicit normalize-then-angle scalar entry retains the same20-degree
 *    cardinal arc under nonunit signed scales,2^±500/2^±600 and1e300 finite
 *    components. A zero first quaternion uses the documented identity before
 *    reading the60-degree target; a nonfinite component remains nonfinite.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States radians/degree expectations, shorter-arc sign equivalence, noncommuting geometry, small-angle resolution, independent scalar-Y values and explicit pre-normalization semantics in five scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public Quaternion.angle/angleAfterNormalize on literal unit/nonunit endpoints and products, checks known geodesics, pair/sign symmetry, tiny corrections and zero, and supplements physical values with exact parity to the explicit normalize-then-angle expression. Actual rotateVectorY independently distinguishes cardinal and noncommuting order.
 * @evidence contracts/development/testing.md#independent-expectations The wrapped cardinal difference is20 degrees. X90/Y90 and their written products have absolute dot1/2, giving2acos(1/2)=120 degrees. Ordinary Rx90 maps(x,y,z) to(x,-z,y), and Ry90 maps it to(z,y,-x); applying these matrices in the stated order fixes all scalar-Y values. A cardinal half-angle directly encodes each tiny input. Identity allows1e-14 radians for normalization/Hamilton product roundoff; tiny nonzero angles retain relative1e-12 agreement, so that zero bound is no deadzone.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers shortest versus long arc, either quaternion sign, reversed arguments, noncommuting axes/products, scalar-Y observations, tiny angles, identical rotations and the actual pre-normalization entry with signed/nonunit/large/zero/nonfinite inputs. The broader normalization matrix remains with existing normalization/inverse entries.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable math unit owns literal unit/nonunit endpoints and calls existing public Quaternion entries without a host, compiler, foreign replacement or test-only helper export.
 */
export function test_unit_engine_math_quaternion_geodesic_semantics(): void {
  const a: IAutoMovieQuaternion = zturn((170 * Math.PI) / 180);
  const b: IAutoMovieQuaternion = zturn((-170 * Math.PI) / 180);
  for (const [left, right] of [
    [a, b],
    [b, a],
    [negative(a), b],
    [a, negative(b)],
  ] as const)
    TestValidator.predicate(
      "cardinal distance uses the shorter physical arc",
      nclose(Quaternion.angle(left, right), Math.PI / 9, 1e-12),
    );
  const x: IAutoMovieQuaternion = {
    x: Math.SQRT1_2,
    y: 0,
    z: 0,
    w: Math.SQRT1_2,
  };
  const y: IAutoMovieQuaternion = {
    x: 0,
    y: Math.SQRT1_2,
    z: 0,
    w: Math.SQRT1_2,
  };
  TestValidator.predicate(
    "different cardinal quarter-turn axes have the known geodesic",
    nclose(Quaternion.angle(x, y), (2 * Math.PI) / 3, 1e-12),
  );
  const xy: IAutoMovieQuaternion = { x: 0.5, y: 0.5, z: 0.5, w: 0.5 };
  const yx: IAutoMovieQuaternion = { x: 0.5, y: 0.5, z: -0.5, w: 0.5 };
  TestValidator.predicate(
    "noncommuting composed rotations retain their actual separation",
    nclose(Quaternion.angle(xy, yx), (2 * Math.PI) / 3, 1e-12),
  );
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  for (const radians of [1e-9, 1e-5])
    for (const rotation of [zturn(radians), negative(zturn(radians))])
      TestValidator.predicate(
        "small representable orientation corrections remain nonzero",
        nclose(Quaternion.angle(identity, rotation), radians, radians * 1e-12),
      );
  TestValidator.predicate(
    "identical physical rotations have no minimum-angle floor",
    nclose(Quaternion.angle(a, a), 0, 1e-14) &&
      nclose(Quaternion.angle(a, negative(a)), 0, 1e-14),
  );
  for (const [rotation, ordinate] of [
    [x, -5],
    [y, 3],
    [xy, 2],
    [yx, -5],
    [identity, 3],
  ] as const)
    for (const turn of [rotation, negative(rotation)])
      TestValidator.predicate(
        "scalar world-Y observes the independently composed physical turn",
        nclose(
          Quaternion.rotateVectorY(turn, { x: 2, y: 3, z: 5 }),
          ordinate,
          1e-12,
        ),
      );
  for (const factor of [
    0.25,
    -8,
    2 ** -600,
    -(2 ** -500),
    2 ** 500,
    -(2 ** 600),
    1e300,
  ]) {
    const scaled: IAutoMovieQuaternion = {
      x: a.x * factor,
      y: a.y * factor,
      z: a.z * factor,
      w: a.w * factor,
    };
    const actual: number = Quaternion.angleAfterNormalize(scaled, b);
    TestValidator.predicate(
      "explicit normalization preserves the known cardinal arc at each finite scale",
      nclose(actual, Math.PI / 9, 1e-12),
    );
    TestValidator.predicate(
      "the scalar entry preserves both original normalization boundaries exactly",
      nclose(actual, Quaternion.angle(Quaternion.normalize(scaled), b), 0),
    );
  }
  TestValidator.predicate(
    "normalize-then-angle retains the known nonunit quarter turn and zero identity",
    nclose(
      Quaternion.angleAfterNormalize({ x: 0, y: 0, z: 2, w: 2 }, identity),
      Math.PI / 2,
      1e-12,
    ) &&
      nclose(
        Quaternion.angleAfterNormalize(
          { x: 0, y: 0, z: 0, w: 0 },
          zturn(Math.PI / 3),
        ),
        Math.PI / 3,
        1e-12,
      ),
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
