import { AutoMovieEngineMath } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * `assignMinimumCost` gives every row its own column so the summed
 * cost is least (the Hungarian method), and refuses an assignment it cannot
 * make or whose reduced costs overflow.
 *
 * Scenarios:
 *
 * 1. [[4, 1, 3], [2, 0, 5], [3, 2, 2]]: the least total is 1 + 2 + 2 = 5 by rows
 *    to columns 1, 0, 2; every other assignment costs 6 or more.
 * 2. Two rows over three columns, [[1, 2, 3], [2, 4, 6]]: the least total is 2 + 2
 *    = 4, rows to columns 1 and 0.
 * 3. No rows assign nothing.
 * 4. Three rows over two columns, and a ragged row, are refused.
 */
export function test_engine_math_assign_minimum_cost(): void {
  TestValidator.equals(
    "the least-cost assignments",
    [
      AutoMovieEngineMath.assignMinimumCost([
        [4, 1, 3],
        [2, 0, 5],
        [3, 2, 2],
      ]),
      AutoMovieEngineMath.assignMinimumCost([
        [1, 2, 3],
        [2, 4, 6],
      ]),
      AutoMovieEngineMath.assignMinimumCost([]),
    ],
    [[1, 0, 2], [1, 0], []],
  );
  TestValidator.predicate(
    "impossible assignments are refused",
    throwsError(
      (): number[] =>
        AutoMovieEngineMath.assignMinimumCost([
          [1, 2],
          [3, 4],
          [5, 6],
        ]),
      "cannot take distinct columns",
    ) &&
      throwsError(
        (): number[] =>
          AutoMovieEngineMath.assignMinimumCost([
            [1, 2, 3],
            [4, 5],
          ]),
        "row 1 has 2 columns, 3 expected",
      ),
  );
}
