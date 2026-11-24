import {
  solveAutoMovieQuadraticKernel,
  solveAutoMovieQuadraticProgram,
} from "@automovie/engine";
import type { IAutoMovieQuadraticRow } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * The numerical boundary refuses dimensions, sparse holes and coefficients the
 * kernel sentinel domain cannot retain. Adjacent valid values still solve the
 * same one-variable square, and a kernel setup refusal remains visible.
 *
 * Scenarios:
 * 1. Empty/oversized dimensions, unequal vectors and sparse arrays refuse beside
 *    a nonempty consistent problem, including both initial-vector branches.
 * 2. Negative curvature, nonfinite values and the infinity sentinel refuse;
 *    zero curvature and a finite coefficient below the sentinel are admitted.
 * 3. Sparse row holes, duplicate/fractional/outside indices, unequal weights and
 *    reversed bounds refuse. A valid equality at zero remains legal.
 * 4. A zero-dimensional direct kernel call reports setup failure; the next valid
 *    public call succeeds without retained invalid solver state.
 */
export function test_unit_engine_geometry_geometry_quadratic_refusals(): void {
  const solve: typeof solveAutoMovieQuadraticProgram =
    solveAutoMovieQuadraticProgram;
  type Input = Parameters<typeof solve>[0];
  const valid: Input = { diagonal: [1], linear: [0], rows: [] };
  const refuses: (patch: Partial<Input>, message: string) => void = (
    patch: Partial<Input>,
    message: string,
  ): void => {
    TestValidator.predicate(
      "refuses invalid numerical input",
      throwsError(
        (): ReturnType<typeof solve> => solve({ ...valid, ...patch }),
        message,
      ),
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

  refuses({ diagonal: [-1] }, "nonnegative");
  for (const value of [1e30, -1e30])
    refuses({ linear: [value] }, "finite");
  const finite: ReturnType<typeof solve> = solve({
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
  const base: IAutoMovieQuadraticRow = {
    indices: [0],
    weights: [1],
    lower: 0,
    upper: 0,
  };
  refuses({ rows: [{ ...base, weights: [] }] }, "dimensions");
  for (const indices of [[-1], [1], [0, 0]])
    refuses(
      {
        rows: [
          { ...base, indices, weights: indices.map((): number => 1).fill(1) },
        ],
      },
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
  const setup: ReturnType<typeof solveAutoMovieQuadraticKernel> =
    solveAutoMovieQuadraticKernel({
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
}
