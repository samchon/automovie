import { solveAutoMovieQuadraticProgram } from "@automovie/engine";
import { solveAutoMovieQuadraticKernel } from "@automovie/engine/math/solveAutoMovieQuadraticKernel";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * The numerical boundary refuses dimensions, sparse holes and coefficients the
 * native representation cannot retain. Adjacent valid values still solve the
 * same one-variable square, and a native setup refusal remains visible.
 *
 * Scenarios:
 * 1. Empty/oversized dimensions, unequal vectors and sparse arrays refuse beside
 *    a nonempty consistent problem, including both initial-vector branches.
 * 2. Negative curvature, nonfinite values and the infinity sentinel refuse;
 *    zero curvature and a finite coefficient below the sentinel are admitted.
 * 3. Sparse row holes, duplicate/fractional/outside indices, unequal weights and
 *    reversed bounds refuse. A valid equality with a zero term remains legal.
 * 4. A zero-dimensional direct kernel call reports setup failure; the next valid
 *    public call succeeds without retained invalid solver state.
 */
export const test_geometry_quadratic_refusals = (): void => {
  const solve = solveAutoMovieQuadraticProgram;
  type Input = Parameters<typeof solve>[0];
  const valid: Input = { diagonal: [1], linear: [0], rows: [] };
  const refuses = (patch: Partial<Input>, message: string): void => {
    TestValidator.predicate(
      "refuses invalid numerical input",
      throwsError(() => solve({ ...valid, ...patch }), message),
    );
    TestValidator.equals(
      "adjacent valid solve survives",
      solve(valid).status,
      1,
    );
  };
  refuses({ diagonal: [], linear: [] }, "dimensions");
  refuses({ diagonal: new Array(0x80000000) }, "dimensions");
  refuses({ rows: new Array(0x80000000) }, "dimensions");
  refuses({ linear: [] }, "dimensions");
  refuses({ initial: [] }, "dimensions");
  for (const key of ["diagonal", "linear", "initial"] as const)
    refuses({ [key]: new Array(1) }, "finite");
  refuses({ diagonal: [-1] }, "nonnegative");
  for (const value of [NaN, Infinity, -Infinity, 1e30, -1e30])
    refuses({ linear: [value] }, "finite");
  const finite = solve({
    diagonal: [0],
    linear: [0],
    rows: [{ indices: [0], weights: [1], lower: -1e29, upper: 1e29 }],
  });
  TestValidator.equals(
    "finite below infinity sentinel is admitted",
    finite.status,
    1,
  );
  refuses({ rows: new Array(1) }, "complete");
  const base = { indices: [0], weights: [1], lower: 0, upper: 0 };
  refuses({ rows: [{ ...base, weights: [] }] }, "dimensions");
  refuses({ rows: [{ ...base, weights: new Array(1) }] }, "finite");
  for (const indices of [[-1], [1], [0.5], [NaN], new Array<number>(1), [0, 0]])
    refuses(
      { rows: [{ ...base, indices, weights: indices.map(() => 1).fill(1) }] },
      "indices",
    );
  refuses({ rows: [{ ...base, lower: 1 }] }, "ordered");
  refuses({ rows: [{ ...base, lower: -Infinity }] }, "finite");
  refuses({ rows: [{ ...base, upper: Infinity }] }, "finite");
  TestValidator.equals(
    "valid equality and initial value",
    solve({ ...valid, rows: [base], initial: [0] }).status,
    1,
  );
  const setup = solveAutoMovieQuadraticKernel({
    diagonal: [],
    linear: [],
    columns: [0],
    rowIndices: [],
    values: [],
    lower: [],
    upper: [],
  });
  TestValidator.predicate("native setup status is negative", setup.status < 0);
  TestValidator.equals(
    "native refusal cleanup permits recovery",
    solve(valid).status,
    1,
  );
};
