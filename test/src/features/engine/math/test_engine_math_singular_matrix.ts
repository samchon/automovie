import { decomposeAutoMovieSingularMatrix } from "@automovie/engine";
import type {
  IAutoMovieSingularDecomposition,
  IAutoMovieSingularMatrixBudget,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * `decomposeAutoMovieSingularMatrix` is a one-sided Jacobi singular value
 * decomposition: singular values in descending order, unit left and right
 * columns whose largest right entry is positive, the numerical rank, and the
 * sweeps it took, refusing malformed input or an exhausted budget.
 *
 * Budget: 16 entries, 30 sweeps, 1e-12 orthogonality.
 *
 * Scenarios:
 *
 * 1. Diag(3, 4) needs no rotation: values (4, 3), its columns swapped in the
 *    factors, rank 2, one sweep to see it is already orthogonal.
 * 2. [[1, 0], [0, 1], [1, 1]] has AᵀA = [[2, 1], [1, 2]], eigenvalues 3 and 1:
 *    values (sqrt 3, 1), right columns (1, 1)/sqrt 2 and (1, -1)/sqrt 2, the
 *    tie in the second broken toward its first entry, and U Σ Vᵀ = A.
 * 3. [[1, 1], [1, 1]] has values (2, 0) and rank 1.
 * 4. The zero matrix has values (0, 0), rank 0 and no sweep.
 * 5. Ragged rows, a zero sweep budget, too few entries, and a single sweep for a
 *    matrix that needs a rotation, are refused.
 */
export function test_engine_math_singular_matrix(): void {
  const budget: IAutoMovieSingularMatrixBudget = {
    maxEntries: 16,
    maxSweeps: 30,
    orthogonalityTolerance: 1e-12,
  };
  const near = (
    actual: readonly number[],
    expected: readonly number[],
  ): boolean =>
    actual.length === expected.length &&
    actual.every((value: number, index: number): boolean =>
      nclose(value, expected[index]!, 1e-12),
    );

  const diagonal: IAutoMovieSingularDecomposition =
    decomposeAutoMovieSingularMatrix(
      [
        [3, 0],
        [0, 4],
      ],
      budget,
    );
  TestValidator.predicate(
    "a diagonal matrix needs no rotation",
    near(diagonal.singularValues, [4, 3]) &&
      near(diagonal.rightColumns[0]!, [0, 1]) &&
      near(diagonal.rightColumns[1]!, [1, 0]) &&
      near(diagonal.leftColumns[0]!, [0, 1]) &&
      near(diagonal.leftColumns[1]!, [1, 0]) &&
      diagonal.numericalRank === 2 &&
      diagonal.sweeps === 1,
  );

  const rows: number[][] = [
    [1, 0],
    [0, 1],
    [1, 1],
  ];
  const tall: IAutoMovieSingularDecomposition =
    decomposeAutoMovieSingularMatrix(rows, budget);
  const reconstructs: boolean = rows.every(
    (row: number[], i: number): boolean =>
      row.every((value: number, j: number): boolean =>
        nclose(
          tall.singularValues.reduce(
            (sum: number, sigma: number, k: number): number =>
              sum +
              tall.leftColumns[k]![i]! * sigma * tall.rightColumns[k]![j]!,
            0,
          ),
          value,
          1e-12,
        ),
      ),
  );
  TestValidator.predicate(
    "a tall matrix decomposes to its eigenvalue square roots and rebuilds",
    near(tall.singularValues, [Math.sqrt(3), 1]) &&
      near(tall.rightColumns[0]!, [Math.SQRT1_2, Math.SQRT1_2]) &&
      near(tall.rightColumns[1]!, [Math.SQRT1_2, -Math.SQRT1_2]) &&
      tall.numericalRank === 2 &&
      reconstructs,
  );

  const ones: IAutoMovieSingularDecomposition =
    decomposeAutoMovieSingularMatrix(
      [
        [1, 1],
        [1, 1],
      ],
      budget,
    );
  const zero: IAutoMovieSingularDecomposition =
    decomposeAutoMovieSingularMatrix(
      [
        [0, 0],
        [0, 0],
      ],
      budget,
    );
  TestValidator.predicate(
    "a rank-one and a zero matrix",
    near(ones.singularValues, [2, 0]) &&
      ones.numericalRank === 1 &&
      near(zero.singularValues, [0, 0]) &&
      zero.numericalRank === 0 &&
      zero.sweeps === 0,
  );

  const skew: number[][] = [
    [1, 1],
    [0, 1],
  ];
  TestValidator.predicate(
    "malformed input and an exhausted budget are refused",
    throwsError(
      (): unknown => decomposeAutoMovieSingularMatrix([[1, 2], [3]], budget),
      "rectangular rows required",
    ) &&
      throwsError(
        (): unknown =>
          decomposeAutoMovieSingularMatrix(skew, { ...budget, maxSweeps: 0 }),
        "finite work budgets required",
      ) &&
      throwsError(
        (): unknown =>
          decomposeAutoMovieSingularMatrix(rows, { ...budget, maxEntries: 5 }),
        "finite work budgets required",
      ) &&
      throwsError(
        (): unknown =>
          decomposeAutoMovieSingularMatrix(skew, { ...budget, maxSweeps: 1 }),
        "sweep budget exhausted",
      ),
  );
}
