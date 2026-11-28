import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, qclose, qunit } from "../../internal/predicates";
import { makeRng, randomUnitQuaternion } from "../../internal/random";

/**
 * `AutoMovieEngineQuaternion` composes, inverts, interpolates and applies rotations; each case
 * is a hand-computed rotation of a unit axis.
 *
 * Scenarios:
 *
 * 1. `multiply` follows Hamilton's rule: i * j = k, j * i = -k, i * i = -1.
 * 2. `fromAxisAngle` of 90 degrees about z is (0, 0, sqrt(1/2), sqrt(1/2)).
 * 3. `rotateVector` turns (1, 0, 0) into (0, 1, 0) by that quarter turn, and
 *    `rotateVectorY` reads the y component. A half turn keeps representable
 *    coordinates across an overflowing intermediate and retains a subnormal
 *    axial coordinate. An unrepresentable rotated component still overflows.
 * 4. `inverse` of the quarter turn composed with it gives the identity.
 * 5. `slerp` halfway between the identity and the quarter turn is 45 degrees about
 *    z: (0, 0, sin 22.5, cos 22.5).
 * 6. `angle` between the identity and the quarter turn is pi / 2 either way, and
 *    `angleAfterNormalize` agrees for unit inputs.
 * 7. `normalize` scales (0, 0, 0, 2) to the identity.
 * 8. Over 256 random unit quaternions from a fixed seed: the product and the slerp
 *    stay unit, slerp at 0 and 1 give its ends (up to sign), normalizing a unit
 *    quaternion changes nothing, and multiplication associates, all within
 *    tolerance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers Hamilton products, axis turns, interpolation, inverse, normalization, numerical limits and fixed-seed invariants.
 * @evidence contracts/development/testing.md#behavioral-verification Calls AutoMovieEngineQuaternion operations directly with basis quaternions, signed endpoints, extreme components and a fixed-seed sweep. Prepared interpolation is read at several shares and after a result changes.
 * @evidence contracts/development/testing.md#independent-expectations Hamilton basis products, analytic half-angle values and independent vector turns give exact references. Unit norm, composition order, endpoint equivalence up to sign and rotation limits distinguish wrong order, long arcs and overflow or underflow errors.
 */
export function test_engine_math_quaternion(): void {
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
    AutoMovieEngineQuaternion.multiply(q(1, 0, 0, 0), q(0, 1, 0, 0)),
    q(0, 0, 1, 0),
  );
  TestValidator.equals(
    "ji",
    AutoMovieEngineQuaternion.multiply(q(0, 1, 0, 0), q(1, 0, 0, 0)),
    q(0, 0, -1, 0),
  );
  TestValidator.equals(
    "ii",
    AutoMovieEngineQuaternion.multiply(q(1, 0, 0, 0), q(1, 0, 0, 0)),
    q(0, 0, 0, -1),
  );

  // 2.
  const quarter: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    90,
  );
  TestValidator.predicate("axis angle", same(quarter, q(0, 0, h, h)));

  // 3.
  const turned: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(quarter, {
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
    nclose(AutoMovieEngineQuaternion.rotateVectorY(quarter, { x: 1, y: 0, z: 0 }), 1, 1e-12),
  );
  const halfTurn: IAutoMovieQuaternion = q(0, 0, 1, 0);
  const large: number = 2 ** 1023;
  const axial: number = Number.MIN_VALUE;
  const rotatedLarge: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(halfTurn, {
    x: large,
    y: 0,
    z: axial,
  });
  const side: IAutoMovieVector3 = { x: 0, y: large, z: axial };
  TestValidator.predicate(
    "the exact half turn recovers the opposite large component and keeps Z",
    nclose(rotatedLarge.x, -large, 0) &&
      nclose(rotatedLarge.y, 0, 0) &&
      nclose(rotatedLarge.z, axial, 0) &&
      nclose(AutoMovieEngineQuaternion.rotateVectorY(halfTurn, side), -large, 0) &&
      nclose(AutoMovieEngineQuaternion.rotateVector(halfTurn, side).y, -large, 0),
  );
  const diagonal: IAutoMovieVector3 = {
    x: Number.MAX_VALUE,
    y: Number.MAX_VALUE,
    z: 0,
  };
  const eighthTurn: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    45,
  );
  TestValidator.predicate(
    "a 45-degree turn of the diagonal still overflows its Y projection",
    AutoMovieEngineQuaternion.rotateVector(eighthTurn, diagonal).y === Infinity &&
      AutoMovieEngineQuaternion.rotateVectorY(eighthTurn, diagonal) === Infinity,
  );

  // 4.
  TestValidator.predicate(
    "inverse",
    same(AutoMovieEngineQuaternion.multiply(AutoMovieEngineQuaternion.inverse(quarter), quarter), identity),
  );

  // 5.
  const half: IAutoMovieQuaternion = AutoMovieEngineQuaternion.slerp(identity, quarter, 0.5);
  TestValidator.predicate(
    "slerp",
    same(half, q(0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8))),
  );

  // 6.
  TestValidator.predicate(
    "angle",
    nclose(AutoMovieEngineQuaternion.angle(identity, quarter), Math.PI / 2, 1e-12),
  );
  TestValidator.predicate(
    "angle reversed",
    nclose(AutoMovieEngineQuaternion.angle(quarter, identity), Math.PI / 2, 1e-12),
  );
  TestValidator.predicate(
    "angle after normalize",
    nclose(
      AutoMovieEngineQuaternion.angleAfterNormalize(identity, quarter),
      Math.PI / 2,
      1e-12,
    ),
  );

  // 7.
  TestValidator.predicate(
    "normalize",
    same(AutoMovieEngineQuaternion.normalize(q(0, 0, 0, 2)), identity),
  );
  // 8. Identity and composition.
  const y90: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );
  TestValidator.predicate(
    "zero axis",
    qclose(AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 0 }, 90), identity),
  );
  TestValidator.predicate(
    "identity left",
    qclose(AutoMovieEngineQuaternion.multiply(identity, y90), y90),
  );
  TestValidator.predicate(
    "identity right",
    qclose(AutoMovieEngineQuaternion.multiply(y90, identity), y90),
  );
  TestValidator.predicate(
    "Y90 twice is Y180",
    qclose(AutoMovieEngineQuaternion.multiply(y90, y90), q(0, 1, 0, 0)),
  );
  TestValidator.predicate(
    "product is unit",
    qunit(
      AutoMovieEngineQuaternion.multiply(
        y90,
        AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 37),
      ),
    ),
  );
  const qi: IAutoMovieQuaternion = q(1, 0, 0, 0);
  const qj: IAutoMovieQuaternion = q(0, 1, 0, 0);
  const qk: IAutoMovieQuaternion = q(0, 0, 1, 0);
  TestValidator.predicate(
    "associative on i, j, k",
    qclose(
      AutoMovieEngineQuaternion.multiply(AutoMovieEngineQuaternion.multiply(qi, qj), qk),
      AutoMovieEngineQuaternion.multiply(qi, AutoMovieEngineQuaternion.multiply(qj, qk)),
    ),
  );

  // 9. Inverse.
  TestValidator.predicate(
    "inverse of Y90",
    qclose(AutoMovieEngineQuaternion.inverse(y90), q(0, -h, 0, h)),
  );
  TestValidator.predicate(
    "inverse of Y90 is Y-90",
    qclose(
      AutoMovieEngineQuaternion.inverse(y90),
      AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -90),
    ),
  );
  TestValidator.predicate(
    "inverse of a non-unit",
    qclose(
      AutoMovieEngineQuaternion.inverse(q(1, 2, 3, 4)),
      q(
        -1 / Math.sqrt(30),
        -2 / Math.sqrt(30),
        -3 / Math.sqrt(30),
        4 / Math.sqrt(30),
      ),
    ),
  );
  for (const exponent of [-600, -500, 500, 600])
    TestValidator.predicate(
      `inverse 2^${exponent}`,
      qclose(AutoMovieEngineQuaternion.inverse(q(2 ** exponent, 0, 0, 0)), q(-1, 0, 0, 0)),
    );
  TestValidator.equals(
    "inverse of zero",
    AutoMovieEngineQuaternion.inverse(q(0, 0, 0, 0)),
    identity,
  );

  // 10. Normalize.
  TestValidator.predicate(
    "normalize non-unit",
    qclose(
      AutoMovieEngineQuaternion.normalize(q(1, 2, 3, 4)),
      q(
        1 / Math.sqrt(30),
        2 / Math.sqrt(30),
        3 / Math.sqrt(30),
        4 / Math.sqrt(30),
      ),
    ),
  );
  TestValidator.equals(
    "normalize zero",
    AutoMovieEngineQuaternion.normalize(q(0, 0, 0, 0)),
    identity,
  );
  for (const component of [1e-300, 1e300, Number.MIN_VALUE])
    TestValidator.predicate(
      `normalize ${component}`,
      qclose(
        AutoMovieEngineQuaternion.normalize(q(component, component, component, component)),
        q(0.5, 0.5, 0.5, 0.5),
      ),
    );
  for (const exponent of [-600, -500, 500, 600])
    TestValidator.predicate(
      `normalize 2^${exponent}`,
      qclose(AutoMovieEngineQuaternion.normalize(q(2 ** exponent, 0, 0, 0)), q(1, 0, 0, 0)),
    );

  // 11. Slerp on the short arc.
  const yaw = (degrees: number): IAutoMovieQuaternion =>
    AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, degrees);
  TestValidator.predicate(
    "slerp at 0",
    qclose(AutoMovieEngineQuaternion.slerp(identity, y90, 0), identity),
  );
  TestValidator.predicate(
    "slerp at 1",
    qclose(AutoMovieEngineQuaternion.slerp(identity, y90, 1), y90),
  );
  TestValidator.predicate(
    "slerp midpoint Y45",
    qclose(AutoMovieEngineQuaternion.slerp(identity, y90, 0.5), yaw(45)),
  );
  TestValidator.predicate(
    "opposite hemisphere end",
    qclose(AutoMovieEngineQuaternion.slerp(identity, yaw(200), 1), yaw(200)),
  );
  TestValidator.predicate(
    "opposite hemisphere takes the short arc",
    qclose(AutoMovieEngineQuaternion.slerp(identity, yaw(200), 0.5), yaw(-80), 1e-3),
  );
  TestValidator.predicate(
    "opposite midpoint unit",
    qunit(AutoMovieEngineQuaternion.slerp(identity, yaw(200), 0.5)),
  );
  TestValidator.predicate(
    "near-parallel midpoint",
    qclose(AutoMovieEngineQuaternion.slerp(identity, yaw(0.4), 0.5), yaw(0.2), 1e-3),
  );

  // 12. Prepared slerp from the identity to Z120, either sign of the end.
  const turnZ = (degrees: number): IAutoMovieQuaternion => ({
    x: 0,
    y: 0,
    z: Math.sin((degrees * Math.PI) / 360),
    w: Math.cos((degrees * Math.PI) / 360),
  });
  const end: IAutoMovieQuaternion = turnZ(120);
  for (const sign of [1, -1]) {
    const read = AutoMovieEngineQuaternion.prepareSlerp(
      identity,
      q(end.x * sign, end.y * sign, end.z * sign, end.w * sign),
    );
    const issued: IAutoMovieQuaternion[] = [];
    for (const share of [0.75, 0, 1, 0.25, -0.5, 1.5, 0.25]) {
      const actual: IAutoMovieQuaternion = read(share);
      TestValidator.predicate(
        `prepared ${share}`,
        qclose(actual, turnZ(120 * share), 1e-12),
      );
      TestValidator.predicate(
        `fresh ${share}`,
        issued.every(
          (previous: IAutoMovieQuaternion): boolean => previous !== actual,
        ),
      );
      issued.push(actual);
    }
  }
  const chord = AutoMovieEngineQuaternion.prepareSlerp(identity, turnZ(1));
  for (const share of [0.25, 0.75, 1.5, 0, 1]) {
    const z: number = share * Math.sin(Math.PI / 360);
    const w: number = 1 - share + share * Math.cos(Math.PI / 360);
    const length: number = Math.hypot(z, w);
    TestValidator.predicate(
      `near-parallel chord ${share}`,
      qclose(chord(share), q(0, 0, z / length, w / length), 1e-12),
    );
  }
  const poisoned = AutoMovieEngineQuaternion.prepareSlerp(identity, end);
  const previous: IAutoMovieQuaternion = poisoned(0.25);
  previous.z = 123;
  TestValidator.predicate(
    "output edits do not poison replay",
    qclose(poisoned(0.25), turnZ(30), 1e-12),
  );
  // 13. Seeded invariants over 256 random unit quaternions (replayable).
  const rng: () => number = makeRng(0x51ed7a17);
  for (let i: number = 0; i < 256; ++i) {
    const a: IAutoMovieQuaternion = randomUnitQuaternion(rng);
    const b: IAutoMovieQuaternion = randomUnitQuaternion(rng);
    const c: IAutoMovieQuaternion = randomUnitQuaternion(rng);
    const share: number = rng();
    TestValidator.predicate(
      `multiply stays unit #${i}`,
      qunit(AutoMovieEngineQuaternion.multiply(a, b)),
    );
    TestValidator.predicate(
      `slerp stays unit #${i}`,
      qunit(AutoMovieEngineQuaternion.slerp(a, b, share)),
    );
    TestValidator.predicate(
      `slerp at 0 is a #${i}`,
      qclose(AutoMovieEngineQuaternion.slerp(a, b, 0), a),
    );
    TestValidator.predicate(
      `slerp at 1 is b #${i}`,
      qclose(AutoMovieEngineQuaternion.slerp(a, b, 1), b),
    );
    const unit: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(a);
    TestValidator.predicate(
      `normalize is idempotent #${i}`,
      qclose(AutoMovieEngineQuaternion.normalize(unit), unit),
    );
    TestValidator.predicate(
      `multiply is associative #${i}`,
      qclose(
        AutoMovieEngineQuaternion.multiply(AutoMovieEngineQuaternion.multiply(a, b), c),
        AutoMovieEngineQuaternion.multiply(a, AutoMovieEngineQuaternion.multiply(b, c)),
      ),
    );
  }
}
