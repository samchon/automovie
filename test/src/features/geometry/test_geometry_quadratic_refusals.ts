import { solveAutoMovieQuadraticProgram } from "@automovie/engine";
import { solveAutoMovieQuadraticKernel } from "@automovie/engine/math/solveAutoMovieQuadraticKernel";
import { TestValidator } from "@nestia/e2e";

import { type IAutoMovieQuadraticRow } from "@automovie/engine";
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
 *    reversed bounds refuse. A valid equality at zero remains legal.
 * 4. A zero-dimensional direct kernel call reports setup failure; the next valid
 *    public call succeeds without retained invalid solver state.
 *
 * @evidence contracts/testing.md#behavioral-verification Sends each existing malformed QP twin through the actual public adapter, requiring a located admission diagnostic and a successful adjacent valid solve. It also admits zero curvature, below-sentinel bounds and equality/initial input, then observes direct zero-dimensional kernel setup failure and valid recovery.
 * @evidence contracts/testing.md#independent-expectations Positive int32 dimensions, dense matched vectors, nonnegative curvature, finite magnitudes below 1e30, unique resident row indices and ordered nullable endpoints define admission. Each mutation violates one authored rule; native setup failure must remain a negative transport status. Status-only positive controls establish admission/recovery, not numerical optimum or geometric validity.
 * @evidence contracts/testing.md#distinguishing-cases Preserves oversized/empty/mismatched/sparse dimensions, initial-vector branches, negative/nonfinite/sentinel coefficients, zero curvature, below-sentinel bounds, sparse rows/weights/indices, duplicates/fractions/outside references and reversed/infinite bounds. Analytic solutions and allocation-byte boundaries have their own QP entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry is CPU/WebAssembly integration: explicit rule refusals stop before assembly, while valid controls and direct setup call reach the pinned reactor. It installs no consumer, builds no native artifact and starts no process, browser or GPU; no extra cases are registered.
 */
export function test_geometry_quadratic_refusals(): void {
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
  for (const key of ["diagonal", "linear", "initial"] as const)
    refuses({ [key]: new Array(1) }, "finite");
  refuses({ diagonal: [-1] }, "nonnegative");
  for (const value of [NaN, Infinity, -Infinity, 1e30, -1e30])
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
  refuses({ rows: [{ ...base, weights: new Array(1) }] }, "finite");
  for (const indices of [[-1], [1], [0.5], [NaN], new Array<number>(1), [0, 0]])
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
