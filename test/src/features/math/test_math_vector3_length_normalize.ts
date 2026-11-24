import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/**
 * Euclidean vector length and normalization retain the 3-4-5 norm and the declared zero-vector convention.
 *
 * Scenarios:
 *
 * 1. The 3–4–5 right triangle pins the norm: length (3,4,0) → 5; and the zero
 *    vector has length 0.
 * 2. Normalizing (3,4,0) yields a vector of length 1.
 * 3. Normalization preserves direction: (5,0,0) → (1,0,0).
 * 4. The degenerate zero vector normalizes back to zero (the divide-by-zero guard)
 *    instead of producing NaNs.
 * 5. Owned positive-X accessors change magnitude between actual reads.
 *    Ordinary→2^600 and2^-600→1 both retain unitX; the original second
 *    range check prevents later raw/private squares from overflowing.
 * 6. Scalar distance retains the3-4-5 separation, exact-power2^±500/±600
 *    axis scales and original a.x,b.x,a.y,b.y,a.z,b.z subtraction order.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls length and normalize, checking the ordinary norm, normalized unit magnitude, axis direction and zero input. A wrong magnitude or dividing a zero direction into NaNs fails. Owned live getter traces require the original normalization branch/reread order and prevent reusing an earlier magnitude gate for later values. Literal/scaled scalar distances also require current complete differences without rereading original points.
 * @evidence contracts/development/testing.md#independent-expectations The Pythagorean theorem gives sqrt(3 squared + 4 squared) = 5, and a positive X-axis vector normalizes to +X. Zero normalization follows the explicit API convention; checking normalized magnitude with the production length method can share a coherent defect, so the cardinal direction supplies a separate coordinate expectation. Every owned accessor value remains positiveX, so both magnitude transitions still normalize to(1,0,0). The original ordinary-input path observes callerXYZ four times; rescaling to private data observes it twice, after which private length must recheck that new magnitude. The3-4-5 point difference has norm5; a sole2^e difference has distance2^e, including safe-square certificate edges e=±500 and fallback e=±600. Scalar distance completes each a/b difference once in XYZ order.
 * @evidence contracts/development/testing.md#distinguishing-cases Keeps an ordinary nonaxis norm, exact zero length, ordinary normalized magnitude, axis direction and zero normalization. Adds two owned live-magnitude transitions/read-order boundaries and scalar-distance literal, exact-power and input-order cases. The broader stable tiny/huge/subnormal normalization and nonfinite matrix remain owned by extreme-normalize.
 * @evidence contracts/development/testing.md#execution-ownership The named math function owns all synchronous assertions and calls portable Vector3 source without consumer installation, native build, process, browser, GPU or dynamic registration.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The 3–4–5 right triangle pins the norm: length (3,4,0) → 5; and the zero).
 */
export function test_math_vector3_length_normalize(): void {
  TestValidator.predicate(
    "3-4-5 length",
    nclose(Vector3.length({ x: 3, y: 4, z: 0 }), 5, 0),
  );
  TestValidator.predicate(
    "zero length",
    nclose(Vector3.length(Vector3.create()), 0, 0),
  );
  TestValidator.predicate(
    "normalized vector is unit",
    nclose(Vector3.length(Vector3.normalize({ x: 3, y: 4, z: 0 })), 1),
  );
  TestValidator.predicate(
    "normalize keeps direction",
    vclose(Vector3.normalize({ x: 5, y: 0, z: 0 }), { x: 1, y: 0, z: 0 }),
  );
  TestValidator.predicate(
    "normalize of zero stays zero",
    vclose(Vector3.normalize(Vector3.create()), Vector3.create()),
  );
  for (const [initial, later, repetitions] of [[1, 2 ** 600, 4], [2 ** -600, 1, 2]] as const) {
    let first: boolean = true;
    const trace: string[] = [];
    const input: IAutoMovieVector3 = {
      get x(): number { trace.push("x"); const value: number = first ? initial : later; first = false; return value; },
      get y(): number { trace.push("y"); return 0; },
      get z(): number { trace.push("z"); return 0; },
    };
    const normalized: IAutoMovieVector3 = Vector3.normalize(input);
    TestValidator.predicate("current norm rechecks the actual later raw or rescaled magnitude",
      vclose(normalized, { x: 1, y: 0, z: 0 }, 1e-12));
    TestValidator.equals("live normalization retains original ordered caller reads in each branch", trace,
      repetitions === 4 ? ["x", "y", "z", "x", "y", "z", "x", "y", "z", "x", "y", "z"] :
        ["x", "y", "z", "x", "y", "z"]);
  }
  TestValidator.predicate("scalar point distance retains the literal3-4-5 separation",
    nclose(Vector3.distance({ x: 1, y: 2, z: 3 }, { x: 4, y: 6, z: 3 }), 5, 0));
  for (const exponent of [-600, -500, 500, 600]) {
    const scale: number = 2 ** exponent;
    TestValidator.predicate(`scalar distance retains exact-power axis norm at2^${exponent}`,
      nclose(Vector3.distance({ x: scale, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }) / scale, 1, 0));
  }
  const trace: string[] = [];
  const a: IAutoMovieVector3 = {
    get x(): number { trace.push("a.x"); return 1; },
    get y(): number { trace.push("a.y"); return 2; },
    get z(): number { trace.push("a.z"); return 3; },
  };
  const b: IAutoMovieVector3 = {
    get x(): number { trace.push("b.x"); return 4; },
    get y(): number { trace.push("b.y"); return 6; },
    get z(): number { trace.push("b.z"); return 3; },
  };
  TestValidator.predicate("owned getter points retain their literal distance", nclose(Vector3.distance(a, b), 5, 0));
  TestValidator.equals("scalar distance captures each original subtraction in order", trace, ["a.x", "b.x", "a.y", "b.y", "a.z", "b.z"]);
}
