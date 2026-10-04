import { interpolateHumanBasisSourceTriangle } from "@automovie/human/common/basis/interpolateHumanBasisSourceTriangle";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * Ordered two-coordinate source charts evaluate the same affine quantity for
 * geometry and normals, without repairing a redundant weight triple.
 *
 * Scenarios:
 * 1. The independent field 7+2x+3y is reproduced on the unit triangle's
 *    interior, all edges, corners and a composed child-triangle coordinate.
 * 2. A non-dyadic opposite-edge coordinate reads exactly zero anchor weight;
 *    huge unused differences and exact corner cancellation are not evaluated.
 * 3. Finite chart boundaries succeed beside negative/outside/nonfinite inputs;
 *    unrepresentable active arithmetic refuses and recovery preserves inputs.
 */
export const test_subject_human_source_triangle_coordinates = (): void => {
  const values: [number, number, number] = [7, 9, 10];
  for (const [u, v] of [
    [0, 0],
    [1, 0],
    [0, 1],
    [0, 0.25],
    [0.25, 0],
    [0.2, 0.8],
    [0.2, 0.3],
  ] as const)
    TestValidator.predicate(
      "independent affine field",
      nclose(
        interpolateHumanBasisSourceTriangle(values, [u, v]),
        7 + 2 * u + 3 * v,
        1e-12,
      ),
    );
  // A child has corners (0,0),(1/2,0),(0,1/2). Its (.2,.3) chart point is
  // (.1,.15) in the original triangle, derived independently by coordinates.
  const child = [7, 8, 8.5] as const;
  TestValidator.predicate(
    "composed source coordinates",
    nclose(
      interpolateHumanBasisSourceTriangle(child, [0.2, 0.3]),
      interpolateHumanBasisSourceTriangle(values, [0.1, 0.15]),
      1e-12,
    ),
  );
  TestValidator.equals(
    "inactive opposite anchor",
    interpolateHumanBasisSourceTriangle([1, 0, 0], [0.2, 0.8]),
    0,
  );
  TestValidator.equals(
    "exact stored corner avoids cancellation",
    interpolateHumanBasisSourceTriangle([1e20, 1, -1], [1, 0]),
    1,
  );
  TestValidator.predicate(
    "inactive second difference",
    nclose(
      interpolateHumanBasisSourceTriangle(
        [Number.MAX_VALUE, -Number.MAX_VALUE, Number.MAX_VALUE],
        [0, 0.5],
      ),
      Number.MAX_VALUE,
    ),
  );
  TestValidator.predicate(
    "inactive third difference",
    nclose(
      interpolateHumanBasisSourceTriangle(
        [Number.MAX_VALUE, Number.MAX_VALUE, -Number.MAX_VALUE],
        [0.5, 0],
      ),
      Number.MAX_VALUE,
    ),
  );
  for (const coordinates of [
    [-Number.MIN_VALUE, 0],
    [0, -Number.MIN_VALUE],
    [0.6, 0.5],
    [NaN, 0],
    [0, NaN],
    [Infinity, 0],
    [0, -Infinity],
  ] as [number, number][]) {
    const saved = coordinates.slice();
    TestValidator.predicate(
      "invalid chart refuses",
      throwsError(() =>
        interpolateHumanBasisSourceTriangle(values, coordinates),
      ),
    );
    TestValidator.predicate(
      "coordinate input unchanged",
      coordinates.every((value, i) => Object.is(value, saved[i])),
    );
  }
  for (const corners of [
    [NaN, 1, 2],
    [1, Infinity, 2],
    [1, 2, -Infinity],
  ] as [number, number, number][])
    TestValidator.predicate(
      "nonfinite source refuses",
      throwsError(() =>
        interpolateHumanBasisSourceTriangle(corners, [0.2, 0.3]),
      ),
    );
  const sparse = new Array<number>(3) as [number, number, number];
  TestValidator.predicate(
    "missing stored corners refuse even at exact anchor",
    throwsError(() => interpolateHumanBasisSourceTriangle(sparse, [0, 0])),
  );
  TestValidator.predicate(
    "active affine overflow refuses",
    throwsError(() =>
      interpolateHumanBasisSourceTriangle(
        [Number.MAX_VALUE, -Number.MAX_VALUE, 0],
        [0.5, 0],
      ),
    ),
  );
  TestValidator.predicate(
    "active opposite-edge overflow refuses",
    throwsError(() =>
      interpolateHumanBasisSourceTriangle(
        [0, Number.MAX_VALUE, -Number.MAX_VALUE],
        [0.2, 0.8],
      ),
    ),
  );
  TestValidator.predicate(
    "recovery after refusal",
    nclose(interpolateHumanBasisSourceTriangle(values, [0.2, 0.3]), 8.3, 1e-12),
  );
  TestValidator.equals("source values unchanged", values, [7, 9, 10]);
};
