import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { equalGeometryTestValues } from "../internal/equalGeometryTestValues";
import { nclose } from "../internal/nclose";

/**
 * Component-wise vector arithmetic retains the independently calculated values and record shape; the authored integer-valued coordinates use zero numeric tolerance.
 *
 * Scenarios:
 *
 * 1. Add (1,2,3)+(4,5,6) → (5,7,9), the per-component sum.
 * 2. Subtract (4,5,6)−(1,2,3) → (3,3,3).
 * 3. Scale (1,2,3)·2 → (2,4,6).
 * 4. Dot (1,2,3)·(4,5,6) → 32, and the dot of two perpendicular axes is 0, pinning
 *    the orthogonality the projection and lighting math rely on.
 * 5. Add-scaled(1,2,3)+(2,-3,4)*0.5 gives(2,0.5,5), completing
 *    direction.xyz scale reads before origin.xyz addition reads.
 * 6. Add-scaled results are fresh, retain all-negative zero arithmetic and
 *    cannot lend an edited earlier point to a later identical observation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Executes create, add, subtract, scale, dot and addScaled, asserting each original scalar/vector result and ordered enumerable record fields. Owned getter order, negative zeros and old-output poison also expose fused arithmetic that changes raw observation/ownership. Reversed subtraction, missing components or wrong products fail while the original exact arithmetic remains legal.
 * @evidence contracts/development/testing.md#independent-expectations Per-coordinate integer sums/differences/products give (5,7,9), (3,3,3), (2,4,6) and dot 32; orthogonal basis vectors have zero dot. The observer uses nclose with zero tolerance for numeric leaves and retains structural comparison; it does not generate expectations. Half of(2,-3,4) is(1,-1.5,2), fixing the fused point(2,0.5,5) exactly. All-negative-zero addition remains negative zero. The original scale-then-add evaluation reads all three direction coordinates before the origin, so the owned six-entry trace is a language-level input-observation contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Keeps nonzero addition/subtraction/scaling, an ordinary dot and the adjacent orthogonal zero dot. Fused fractional scaling additionally covers negative coordinates, original read order, signed zero and result independence. Negative scale coefficients, overflow and malformed input are outside this entry; magnitude and normalization have separate tests.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable named entry directly calls portable Vector3 runtime methods and owns its synchronous assertions. It installs no consumer, builds no native artifact and starts no process, browser or GPU; no cases are dynamically registered.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Add (1,2,3)+(4,5,6) → (5,7,9), the per-component sum.).
 */
export function test_math_vector3_arithmetic(): void {
  const a: IAutoMovieVector3 = Vector3.create(1, 2, 3);
  const b: IAutoMovieVector3 = Vector3.create(4, 5, 6);
  TestValidator.predicate(
    "add",
    equalGeometryTestValues(Vector3.add(a, b), { x: 5, y: 7, z: 9 }),
  );
  TestValidator.predicate(
    "subtract",
    equalGeometryTestValues(Vector3.subtract(b, a), {
      x: 3,
      y: 3,
      z: 3,
    }),
  );
  TestValidator.predicate(
    "scale",
    equalGeometryTestValues(Vector3.scale(a, 2), { x: 2, y: 4, z: 6 }),
  );
  TestValidator.predicate("dot", nclose(Vector3.dot(a, b), 32, 0));
  TestValidator.predicate(
    "dot orthogonal is zero",
    nclose(Vector3.dot({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }), 0, 0),
  );
  const trace: string[] = [];
  const origin: IAutoMovieVector3 = observed({ x: 1, y: 2, z: 3 }, "origin", trace);
  const direction: IAutoMovieVector3 = observed({ x: 2, y: -3, z: 4 }, "direction", trace);
  const fused: IAutoMovieVector3 = Vector3.addScaled(origin, direction, 0.5);
  TestValidator.predicate("add-scaled retains the independent affine point",
    equalGeometryTestValues(fused, { x: 2, y: 0.5, z: 5 }));
  TestValidator.equals("scaling completes direction reads before any origin coordinate is added", trace,
    ["direction.x", "direction.y", "direction.z", "origin.x", "origin.y", "origin.z"]);
  fused.x = 999;
  const replay: IAutoMovieVector3 = Vector3.addScaled(origin, direction, 0.5);
  const zero: IAutoMovieVector3 = Vector3.addScaled({ x: -0, y: -0, z: -0 }, { x: -0, y: -0, z: -0 }, 1);
  TestValidator.predicate("fused points remain fresh and preserve original negative-zero sums",
    replay !== fused && equalGeometryTestValues(replay, { x: 2, y: 0.5, z: 5 }) && Object.is(fused.x, 999) &&
    Object.is(zero.x, -0) && Object.is(zero.y, -0) && Object.is(zero.z, -0));
}

/** Caller-owned coordinate getters expose original argument evaluation without library replacement. */
function observed(value: IAutoMovieVector3, name: string, trace: string[]): IAutoMovieVector3 {
  return {
    get x(): number { trace.push(`${name}.x`); return value.x; },
    get y(): number { trace.push(`${name}.y`); return value.y; },
    get z(): number { trace.push(`${name}.z`); return value.z; },
  };
}
