import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose, qunit } from "../internal/predicates";
import { makeRng, randomUnitQuaternion } from "../internal/random";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Samples three rotations and one progress value in the original draw order, then checks multiplication/slerp unit norms, slerp endpoints, normalization idempotence and multiplication associativity. Algebraic drift on a sampled rotation fails while equivalent quaternion signs remain legal.
 * @evidence contracts/testing.md#independent-expectations Unit closure, endpoint identity, idempotence and associativity follow quaternion algebra rather than recorded outputs. The sampler's squared radii sum to one, but both sides of each law use the production operators and can share a coherent defect; qclose also assumes unit operands and compares rotations up to sign.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the seed, all 256 iterations and every draw/assertion. Hand cardinal rotations and zero/extreme magnitudes are owned by companion tests; finite random sampling neither covers every branch nor validates arbitrary malformed quaternions.
 * @evidence contracts/testing.md#execution-ownership This named portable math entry owns every iteration and uses caller-local deterministic random state. It starts no process, browser or GPU, builds no native artifact and dynamically registers no cases.
 */
export function test_math_quaternion_invariants(): void {
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
