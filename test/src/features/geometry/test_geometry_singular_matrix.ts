import { decomposeAutoMovieSingularMatrix } from "@automovie/engine/math/decomposeAutoMovieSingularMatrix";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Original-design factors preserve a weak direction and a wide right nullspace.
 *
 * Scenarios:
 * 1. Analytic diagonal and repeated-value factors reconstruct without changing borrowed input.
 * 2. Two nearly parallel columns retain a known 1e-10 singular value under common large and small scales.
 * 3. The eight-row [I|c] design returns its analytic one-dimensional right nullspace and all nine orthogonal right vectors.
 * 4. Zero/singleton designs work; malformed, nonfinite, exhausted and unrepresentable designs throw independently of the next valid call.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the numerical kernel and observes factors, reconstruction, right-vector orthogonality, borrowed-array stability and throwing work/range admission. It catches a normal-matrix implementation that loses the weak original-design direction.
 * @evidence contracts/testing.md#independent-expectations Diagonal values are their absolute entries. For columns (1,e,0) and (1,0,e), singular values are sqrt(2+e^2) and e. For [I|c], A*A transpose = I+c*c transpose gives singular values sqrt(1+norm(c)^2), seven ones and zero, and (-c,1) is its independently known null vector. The test does not compare a snapshot or another call's factors.
 * @evidence contracts/testing.md#distinguishing-cases Covers square, tall, wide, repeated, exact-rank-deficient, ill-conditioned and commonly scaled inputs, zero and singleton shapes, one-entry budget boundaries, nonfinite/ragged data, a deliberately insufficient sweep and overflow. Camera-specific conditioning, estimation and pixel semantics belong to recovery tests.
 * @evidence contracts/testing.md#execution-ownership The portable test_geometry_singular_matrix entry owns finite CPU matrices and assertions only; it starts no compiler, process, filesystem consumer or renderer and replaces no foreign method.
 */
export function test_geometry_singular_matrix(): void {
  const budget: Parameters<typeof decomposeAutoMovieSingularMatrix>[1] = {
    maxEntries: 1024,
    maxSweeps: 64,
    orthogonalityTolerance: 1e-12,
  };
  const matrices: number[][][] = [
    [
      [-3, 0, 0],
      [0, 2, 0],
      [0, 0, 1],
    ],
    [
      [0, 2],
      [-2, 0],
      [0, 0],
    ],
  ];
  for (const rows of matrices) {
    const borrowed: number[][] = structuredClone(rows);
    const result: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
      decomposeAutoMovieSingularMatrix(rows, budget);
    const expected: number[] =
      rows.length === 3 && rows[0]!.length === 3 ? [3, 2, 1] : [2, 2];
    TestValidator.predicate(
      "analytic singular magnitudes",
      result.singularValues.every((value: number, index: number): boolean =>
        nclose(value, expected[index]!, 1e-11),
      ),
    );
    TestValidator.predicate(
      "actual active orthogonality is qualified by the requested budget",
      Number.isFinite(result.maximumActiveColumnCorrelation) &&
        result.maximumActiveColumnCorrelation <=
          budget.orthogonalityTolerance &&
        nclose(result.orthogonalityTolerance, budget.orthogonalityTolerance, 0),
    );
    TestValidator.predicate(
      "borrowed input remains unchanged",
      rows.every((row: number[], i: number): boolean =>
        row.every((value: number, j: number): boolean =>
          nclose(value, borrowed[i]![j]!, 0),
        ),
      ),
    );
    TestValidator.predicate(
      "independent factor equation reconstructs every entry",
      rows.every((row: number[], i: number): boolean =>
        row.every((value: number, j: number): boolean =>
          nclose(
            result.singularValues.reduce(
              (sum: number, singular: number, at: number): number =>
                sum +
                singular *
                  result.leftColumns[at]![i]! *
                  result.rightColumns[at]![j]!,
              0,
            ),
            value,
            1e-10,
          ),
        ),
      ),
    );
  }
  const epsilon: number = 1e-10;
  for (const scale of [1, 1e150, 1e-150]) {
    const result: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
      decomposeAutoMovieSingularMatrix(
        [
          [scale, scale],
          [scale * epsilon, 0],
          [0, scale * epsilon],
        ],
        budget,
      );
    TestValidator.predicate(
      "original-design weak direction survives without normal equations",
      nclose(
        result.singularValues[0]! / scale,
        Math.sqrt(2 + epsilon ** 2),
        1e-12,
      ) && nclose(result.singularValues[1]! / (scale * epsilon), 1, 1e-10),
    );
  }
  const c: number[] = [1, -2, 3, -4, 5, -6, 7, -8];
  const wide: number[][] = c.map((value: number, row: number): number[] => [
    ...Array.from({ length: 8 }, (_: unknown, column: number): number =>
      row === column ? 1 : 0,
    ),
    value,
  ]);
  const decomposition: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(wide, budget);
  const expectedLength: number = Math.sqrt(
    1 +
      c.reduce((sum: number, value: number): number => sum + value * value, 0),
  );
  TestValidator.predicate(
    "wide analytic spectrum and operational rank",
    decomposition.numericalRank === 8 &&
      nclose(decomposition.singularValues[0]!, expectedLength, 1e-10) &&
      decomposition.singularValues
        .slice(1, 8)
        .every((value: number): boolean => nclose(value, 1, 1e-10)) &&
      nclose(decomposition.singularValues[8]!, 0, 1e-10),
  );
  const nullVector: number[] = decomposition.rightColumns[8]!;
  const alignment: number = nullVector.reduce(
    (sum: number, value: number, index: number): number =>
      sum + (value * (index === 8 ? 1 : -c[index]!)) / expectedLength,
    0,
  );
  TestValidator.predicate(
    "right null direction has the independently derived orientation up to sign",
    nclose(Math.abs(alignment), 1, 1e-10) &&
      wide.every((row: number[]): boolean =>
        nclose(
          row.reduce(
            (sum: number, value: number, index: number): number =>
              sum + value * nullVector[index]!,
            0,
          ),
          0,
          1e-10,
        ),
      ),
  );
  for (let first: number = 0; first < 9; first++) {
    for (let second: number = 0; second < 9; second++) {
      const dot: number = decomposition.rightColumns[first]!.reduce(
        (sum: number, value: number, index: number): number =>
          sum + value * decomposition.rightColumns[second]![index]!,
        0,
      );
      TestValidator.predicate(
        "full right basis is orthogonal",
        nclose(dot, first === second ? 1 : 0, 1e-10),
      );
    }
  }
  const zero: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(
      [
        [0, 0],
        [0, 0],
      ],
      budget,
    );
  TestValidator.predicate(
    "zero matrix retains a right basis without inventing left directions",
    zero.numericalRank === 0 &&
      zero.singularValues.every((value: number): boolean =>
        nclose(value, 0, 0),
      ) &&
      zero.leftColumns.every((column: number[]): boolean =>
        column.every((value: number): boolean => nclose(value, 0, 0)),
      ),
  );
  const singleton: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix([[-7]], { ...budget, maxEntries: 1 });
  TestValidator.predicate(
    "singleton exact-entry budget succeeds",
    nclose(singleton.singularValues[0]!, 7, 0),
  );
  const invalid: { rows: number[][]; options: typeof budget }[] = [
    { rows: [], options: budget },
    { rows: [[]], options: budget },
    { rows: [[1, 0], [1]], options: budget },
    { rows: [[Infinity]], options: budget },
    { rows: [[NaN]], options: budget },
    { rows: [[1, 2]], options: { ...budget, maxEntries: 3 } },
    {
      rows: [
        [1, 2],
        [3, 4],
      ],
      options: { ...budget, maxSweeps: 1 },
    },
    { rows: [[1]], options: { ...budget, orthogonalityTolerance: 0 } },
    { rows: [[Number.MAX_VALUE], [Number.MAX_VALUE]], options: budget },
  ];
  for (const candidate of invalid) {
    let refused: boolean = false;
    try {
      decomposeAutoMovieSingularMatrix(candidate.rows, candidate.options);
    } catch (error: unknown) {
      refused = error instanceof Error;
    }
    TestValidator.predicate(
      "malformed, exhausted or unrepresentable factorization throws",
      refused,
    );
  }
  TestValidator.predicate(
    "failed calls retain no state that poisons a later valid call",
    nclose(
      decomposeAutoMovieSingularMatrix([[2]], budget).singularValues[0]!,
      2,
      0,
    ),
  );
}
