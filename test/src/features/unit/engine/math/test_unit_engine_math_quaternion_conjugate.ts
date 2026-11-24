import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose, qunit } from "../../../internal/predicates";
import { makeRng, randomUnitQuaternion } from "../../../internal/random";

/**
 * Quaternion algebraic invariants retain their meaning across the original 256 seeded samples; the finite sweep is replayable and does not prove the whole rotation sphere.
 *
 * Scenarios (each over 256 samples from a fixed seed):
 *
 * 1. Unit preservation: the product and the slerp of two unit quaternions stay
 *    unit-length: the group is closed on the unit sphere.
 * 2. Slerp endpoints: `slerp(a, b, 0)` is `a` and `slerp(a, b, 1)` is `b` (up to
 *    sign: a quaternion and its negation are the same rotation).
 * 3. Normalize idempotence: normalizing an already-unit quaternion is a no-op.
 * 4. Multiply associativity: `(a·b)·c` equals `a·(b·c)` up to sign.
 */
export function test_unit_engine_math_quaternion_conjugate(): void {
  const rng: () => number = makeRng(0x51ed7a17);
  for (let i: number = 0; i < 256; ++i) {
    const a: IAutoMovieQuaternion = randomUnitQuaternion(rng);
    const b: IAutoMovieQuaternion = randomUnitQuaternion(rng);
    const c: IAutoMovieQuaternion = randomUnitQuaternion(rng);
    const t: number = rng();

    TestValidator.predicate(
      `multiply stays unit #${i}`,
      qunit(Quaternion.multiply(a, b)),
    );
    TestValidator.predicate(
      `slerp stays unit #${i}`,
      qunit(Quaternion.slerp(a, b, t)),
    );

    TestValidator.predicate(
      `slerp at 0 is a #${i}`,
      qclose(Quaternion.slerp(a, b, 0), a),
    );
    TestValidator.predicate(
      `slerp at 1 is b #${i}`,
      qclose(Quaternion.slerp(a, b, 1), b),
    );

    const n: IAutoMovieQuaternion = Quaternion.normalize(a);
    TestValidator.predicate(
      `normalize is idempotent #${i}`,
      qclose(Quaternion.normalize(n), n),
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
