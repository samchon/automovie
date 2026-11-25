import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, qclose, qunit } from "../../internal/predicates";
import { makeRng, randomUnitQuaternion } from "../../internal/random";

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
 * 8. Over 256 random unit quaternions from a fixed seed: the product and the slerp
 *    stay unit, slerp at 0 and 1 give its ends (up to sign), normalizing a unit
 *    quaternion changes nothing, and multiplication associates, all within
 *    tolerance.
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
  // 8. Identity and composition.
  const y90: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );
  TestValidator.predicate(
    "zero axis",
    qclose(Quaternion.fromAxisAngle({ x: 0, y: 0, z: 0 }, 90), identity),
  );
  TestValidator.predicate(
    "identity left",
    qclose(Quaternion.multiply(identity, y90), y90),
  );
  TestValidator.predicate(
    "identity right",
    qclose(Quaternion.multiply(y90, identity), y90),
  );
  TestValidator.predicate(
    "Y90 twice is Y180",
    qclose(Quaternion.multiply(y90, y90), q(0, 1, 0, 0)),
  );
  TestValidator.predicate(
    "product is unit",
    qunit(
      Quaternion.multiply(
        y90,
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 37),
      ),
    ),
  );
  const qi: IAutoMovieQuaternion = q(1, 0, 0, 0);
  const qj: IAutoMovieQuaternion = q(0, 1, 0, 0);
  const qk: IAutoMovieQuaternion = q(0, 0, 1, 0);
  TestValidator.predicate(
    "associative on i, j, k",
    qclose(
      Quaternion.multiply(Quaternion.multiply(qi, qj), qk),
      Quaternion.multiply(qi, Quaternion.multiply(qj, qk)),
    ),
  );

  // 9. Inverse.
  TestValidator.predicate(
    "inverse of Y90",
    qclose(Quaternion.inverse(y90), q(0, -h, 0, h)),
  );
  TestValidator.predicate(
    "inverse of Y90 is Y-90",
    qclose(
      Quaternion.inverse(y90),
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -90),
    ),
  );
  TestValidator.predicate(
    "inverse of a non-unit",
    qclose(
      Quaternion.inverse(q(1, 2, 3, 4)),
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
      qclose(Quaternion.inverse(q(2 ** exponent, 0, 0, 0)), q(-1, 0, 0, 0)),
    );
  TestValidator.equals(
    "inverse of zero",
    Quaternion.inverse(q(0, 0, 0, 0)),
    identity,
  );

  // 10. Normalize.
  TestValidator.predicate(
    "normalize non-unit",
    qclose(
      Quaternion.normalize(q(1, 2, 3, 4)),
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
    Quaternion.normalize(q(0, 0, 0, 0)),
    identity,
  );
  for (const component of [1e-300, 1e300, Number.MIN_VALUE])
    TestValidator.predicate(
      `normalize ${component}`,
      qclose(
        Quaternion.normalize(q(component, component, component, component)),
        q(0.5, 0.5, 0.5, 0.5),
      ),
    );
  for (const exponent of [-600, -500, 500, 600])
    TestValidator.predicate(
      `normalize 2^${exponent}`,
      qclose(Quaternion.normalize(q(2 ** exponent, 0, 0, 0)), q(1, 0, 0, 0)),
    );

  // 11. Slerp on the short arc.
  const yaw = (degrees: number): IAutoMovieQuaternion =>
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, degrees);
  TestValidator.predicate(
    "slerp at 0",
    qclose(Quaternion.slerp(identity, y90, 0), identity),
  );
  TestValidator.predicate(
    "slerp at 1",
    qclose(Quaternion.slerp(identity, y90, 1), y90),
  );
  TestValidator.predicate(
    "slerp midpoint Y45",
    qclose(Quaternion.slerp(identity, y90, 0.5), yaw(45)),
  );
  TestValidator.predicate(
    "opposite hemisphere end",
    qclose(Quaternion.slerp(identity, yaw(200), 1), yaw(200)),
  );
  TestValidator.predicate(
    "opposite hemisphere takes the short arc",
    qclose(Quaternion.slerp(identity, yaw(200), 0.5), yaw(-80), 1e-3),
  );
  TestValidator.predicate(
    "opposite midpoint unit",
    qunit(Quaternion.slerp(identity, yaw(200), 0.5)),
  );
  TestValidator.predicate(
    "near-parallel midpoint",
    qclose(Quaternion.slerp(identity, yaw(0.4), 0.5), yaw(0.2), 1e-3),
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
    const read = Quaternion.prepareSlerp(
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
  const chord = Quaternion.prepareSlerp(identity, turnZ(1));
  for (const share of [0.25, 0.75, 1.5, 0, 1]) {
    const z: number = share * Math.sin(Math.PI / 360);
    const w: number = 1 - share + share * Math.cos(Math.PI / 360);
    const length: number = Math.hypot(z, w);
    TestValidator.predicate(
      `near-parallel chord ${share}`,
      qclose(chord(share), q(0, 0, z / length, w / length), 1e-12),
    );
  }
  const poisoned = Quaternion.prepareSlerp(identity, end);
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
      qunit(Quaternion.multiply(a, b)),
    );
    TestValidator.predicate(
      `slerp stays unit #${i}`,
      qunit(Quaternion.slerp(a, b, share)),
    );
    TestValidator.predicate(
      `slerp at 0 is a #${i}`,
      qclose(Quaternion.slerp(a, b, 0), a),
    );
    TestValidator.predicate(
      `slerp at 1 is b #${i}`,
      qclose(Quaternion.slerp(a, b, 1), b),
    );
    const unit: IAutoMovieQuaternion = Quaternion.normalize(a);
    TestValidator.predicate(
      `normalize is idempotent #${i}`,
      qclose(Quaternion.normalize(unit), unit),
    );
    TestValidator.predicate(
      `multiply is associative #${i}`,
      qclose(
        Quaternion.multiply(Quaternion.multiply(a, b), c),
        Quaternion.multiply(a, Quaternion.multiply(b, c)),
      ),
    );
  }
}
