import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../../internal/predicates";

/**
 * `AutoMovieEngineVector3` arithmetic, cross product, norm, normalization, distance and
 * interpolation, each against a hand-computed value.
 *
 * Scenarios:
 *
 * 1. Add (1,2,3)+(4,5,6) is (5,7,9); subtract (4,5,6)-(1,2,3) is (3,3,3); scale
 *    (1,2,3) by 2 is (2,4,6); dot is 32 and 0 for perpendicular axes;
 *    `addScaled` of (1,2,3) and (2,-3,4) by 0.5 is (2,0.5,5), a fresh record
 *    each call, and keeps all-negative-zero sums.
 * 2. The right-handed basis: X x Y = Z, Y x Z = X, Z x X = Y, Y x X = -Z; the
 *    displacement product about (1,2,3) of (4,6,3) and (1,2,5) is (8,-6,0) into
 *    a fresh target and into each of the three inputs, which leaves the other
 *    inputs unchanged.
 * 3. Length of (3,4,0) is 5 and of zero is 0; its normalization has length 1,
 *    (5,0,0) normalizes to (1,0,0) and zero stays zero.
 * 4. Extreme finite magnitudes keep their direction: axis vectors of size 1e155,
 *    1e-200, the smallest subnormal, 2^-511 and 2^511 normalize to (0,0,1) with
 *    length ratio 1; the 3-4-5 vector scaled by 1e155 and 1e-200 normalizes to
 *    (0.6,-0.8,0) with length 5 times the scale; diagonals of the largest and
 *    smallest doubles normalize to 1/sqrt(3) per axis; two largest doubles have
 *    an unrepresentable length, Infinity.
 * 5. Distance (1,2,3)-(4,6,3) is 5; one axis at 2^-600, 2^-500, 2^500, 2^600 has
 *    distance equal to that scale.
 * 6. `lerp` of (0,0,0)-(2,4,6) is the start at 0, the end at 1 and (1,2,3) at 0.5;
 *    `prepareLerp` of (1,2,3)-(5,-2,7) gives (7,-4,9), (2,1,4), (-1,4,1),
 *    (3,0,5) at 1.5, 0.25, -0.5, 0.5 in any order, keeps the copied endpoints
 *    when the inputs change afterwards, and issues independent records.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers XYZ arithmetic, right-handed products, output aliasing, extreme norms and prepared interpolation ownership.
 * @evidence contracts/development/testing.md#behavioral-verification Calls AutoMovieEngineVector3 operations with typed literal vectors, extreme finite inputs and overlapping destinations. Prepared interpolation reads extrapolated and reordered progress after endpoint mutations.
 * @evidence contracts/development/testing.md#independent-expectations Component arithmetic, the right-handed basis and 3-4-5 geometry give exact reference values. Axis and diagonal lengths set independent scale expectations, and explicit endpoint blends give the expected interpolation and extrapolation.
 */
export function test_engine_math_vector3(): void {
  const a: IAutoMovieVector3 = AutoMovieEngineVector3.create(1, 2, 3);
  const b: IAutoMovieVector3 = AutoMovieEngineVector3.create(4, 5, 6);

  // 1.
  TestValidator.equals("add", AutoMovieEngineVector3.add(a, b), { x: 5, y: 7, z: 9 });
  TestValidator.equals("subtract", AutoMovieEngineVector3.subtract(b, a), {
    x: 3,
    y: 3,
    z: 3,
  });
  TestValidator.equals("scale", AutoMovieEngineVector3.scale(a, 2), { x: 2, y: 4, z: 6 });
  TestValidator.equals("dot", AutoMovieEngineVector3.dot(a, b), 32);
  TestValidator.equals(
    "dot perpendicular",
    AutoMovieEngineVector3.dot({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }),
    0,
  );
  const fused: IAutoMovieVector3 = AutoMovieEngineVector3.addScaled(
    { x: 1, y: 2, z: 3 },
    { x: 2, y: -3, z: 4 },
    0.5,
  );
  TestValidator.equals("add scaled", fused, { x: 2, y: 0.5, z: 5 });
  fused.x = 999;
  const replay: IAutoMovieVector3 = AutoMovieEngineVector3.addScaled(
    { x: 1, y: 2, z: 3 },
    { x: 2, y: -3, z: 4 },
    0.5,
  );
  TestValidator.equals("fresh record", replay, { x: 2, y: 0.5, z: 5 });
  const zero: IAutoMovieVector3 = AutoMovieEngineVector3.addScaled(
    { x: -0, y: -0, z: -0 },
    { x: -0, y: -0, z: -0 },
    1,
  );
  TestValidator.predicate(
    "negative zeros",
    Object.is(zero.x, -0) && Object.is(zero.y, -0) && Object.is(zero.z, -0),
  );

  // 2.
  const X: IAutoMovieVector3 = AutoMovieEngineVector3.create(1, 0, 0);
  const Y: IAutoMovieVector3 = AutoMovieEngineVector3.create(0, 1, 0);
  const Z: IAutoMovieVector3 = AutoMovieEngineVector3.create(0, 0, 1);
  TestValidator.equals("X x Y", AutoMovieEngineVector3.cross(X, Y), Z);
  TestValidator.equals("Y x Z", AutoMovieEngineVector3.cross(Y, Z), X);
  TestValidator.equals("Z x X", AutoMovieEngineVector3.cross(Z, X), Y);
  TestValidator.equals("Y x X", AutoMovieEngineVector3.cross(Y, X), { x: 0, y: 0, z: -1 });
  for (const alias of ["new", "origin", "a", "b"] as const) {
    const origin: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
    const pa: IAutoMovieVector3 = { x: 4, y: 6, z: 3 };
    const pb: IAutoMovieVector3 = { x: 1, y: 2, z: 5 };
    const target: IAutoMovieVector3 =
      alias === "origin"
        ? origin
        : alias === "a"
          ? pa
          : alias === "b"
            ? pb
            : { x: 99, y: 88, z: 77 };
    AutoMovieEngineVector3.crossDifferenceInto(target, origin, pa, pb);
    TestValidator.equals(`displacement ${alias}`, target, {
      x: 8,
      y: -6,
      z: 0,
    });
    if (target !== origin)
      TestValidator.equals(`origin kept ${alias}`, origin, {
        x: 1,
        y: 2,
        z: 3,
      });
    if (target !== pa)
      TestValidator.equals(`a kept ${alias}`, pa, { x: 4, y: 6, z: 3 });
    if (target !== pb)
      TestValidator.equals(`b kept ${alias}`, pb, { x: 1, y: 2, z: 5 });
  }

  // 3.
  TestValidator.equals("length 3-4-5", AutoMovieEngineVector3.length({ x: 3, y: 4, z: 0 }), 5);
  TestValidator.equals("length zero", AutoMovieEngineVector3.length(AutoMovieEngineVector3.create()), 0);
  TestValidator.predicate(
    "unit",
    nclose(AutoMovieEngineVector3.length(AutoMovieEngineVector3.normalize({ x: 3, y: 4, z: 0 })), 1, 1e-12),
  );
  TestValidator.equals("direction", AutoMovieEngineVector3.normalize({ x: 5, y: 0, z: 0 }), {
    x: 1,
    y: 0,
    z: 0,
  });
  TestValidator.equals("zero stays zero", AutoMovieEngineVector3.normalize(AutoMovieEngineVector3.create()), {
    x: 0,
    y: 0,
    z: 0,
  });

  // 4.
  for (const size of [1e155, 1e-200, Number.MIN_VALUE, 2 ** -511, 2 ** 511]) {
    const vector: IAutoMovieVector3 = { x: 0, y: 0, z: size };
    TestValidator.predicate(
      `direction ${size}`,
      vclose(AutoMovieEngineVector3.normalize(vector), { x: 0, y: 0, z: 1 }, 1e-12),
    );
    TestValidator.predicate(
      `length ${size}`,
      nclose(AutoMovieEngineVector3.length(vector) / size, 1, 1e-12),
    );
  }
  for (const size of [1e155, 1e-200]) {
    TestValidator.predicate(
      `3-4-5 direction ${size}`,
      vclose(
        AutoMovieEngineVector3.normalize({ x: 3 * size, y: -4 * size, z: 0 }),
        { x: 0.6, y: -0.8, z: 0 },
        1e-12,
      ),
    );
    TestValidator.predicate(
      `3-4-5 length ${size}`,
      nclose(
        AutoMovieEngineVector3.length({ x: 3 * size, y: 4 * size, z: 0 }) / size,
        5,
        1e-12,
      ),
    );
  }
  for (const size of [Number.MAX_VALUE, Number.MIN_VALUE])
    TestValidator.predicate(
      `diagonal ${size}`,
      vclose(
        AutoMovieEngineVector3.normalize({ x: size, y: size, z: size }),
        { x: 1 / Math.sqrt(3), y: 1 / Math.sqrt(3), z: 1 / Math.sqrt(3) },
        1e-12,
      ),
    );
  TestValidator.equals(
    "unrepresentable length",
    AutoMovieEngineVector3.length({ x: Number.MAX_VALUE, y: Number.MAX_VALUE, z: 0 }),
    Infinity,
  );

  // 5.
  TestValidator.equals(
    "distance",
    AutoMovieEngineVector3.distance({ x: 1, y: 2, z: 3 }, { x: 4, y: 6, z: 3 }),
    5,
  );
  for (const exponent of [-600, -500, 500, 600]) {
    const scale: number = 2 ** exponent;
    TestValidator.equals(
      `distance 2^${exponent}`,
      AutoMovieEngineVector3.distance({ x: scale, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }) / scale,
      1,
    );
  }

  // 6.
  const start: IAutoMovieVector3 = AutoMovieEngineVector3.create(0, 0, 0);
  const end: IAutoMovieVector3 = AutoMovieEngineVector3.create(2, 4, 6);
  TestValidator.equals("lerp 0", AutoMovieEngineVector3.lerp(start, end, 0), start);
  TestValidator.equals("lerp 1", AutoMovieEngineVector3.lerp(start, end, 1), end);
  TestValidator.equals("lerp half", AutoMovieEngineVector3.lerp(start, end, 0.5), {
    x: 1,
    y: 2,
    z: 3,
  });
  const from: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
  const to: IAutoMovieVector3 = { x: 5, y: -2, z: 7 };
  const read = AutoMovieEngineVector3.prepareLerp(from, to);
  const expected: [number, IAutoMovieVector3][] = [
    [1.5, { x: 7, y: -4, z: 9 }],
    [0.25, { x: 2, y: 1, z: 4 }],
    [-0.5, { x: -1, y: 4, z: 1 }],
    [0.5, { x: 3, y: 0, z: 5 }],
    [0.25, { x: 2, y: 1, z: 4 }],
  ];
  for (const [share, point] of expected)
    TestValidator.equals(`prepared ${share}`, read(share), point);
  from.x = 99;
  from.z = -11;
  to.y = 88;
  to.z = 12;
  TestValidator.equals("snapshot kept", read(0.25), { x: 2, y: 1, z: 4 });
  TestValidator.equals("raw reads edits", AutoMovieEngineVector3.lerp(from, to, 0.25), {
    x: 75.5,
    y: 23.5,
    z: -5.25,
  });
  const earlier: IAutoMovieVector3 = read(0.25);
  earlier.x = 123;
  TestValidator.equals("independent records", read(0.25), { x: 2, y: 1, z: 4 });
}
