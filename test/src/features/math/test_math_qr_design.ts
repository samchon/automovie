import { decomposeAutoMovieSingularMatrix } from "@automovie/engine/math/decomposeAutoMovieSingularMatrix";
import { reduceAutoMovieQrDesign } from "@automovie/engine/math/reduceAutoMovieQrDesign";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Orthogonal row compression preserves the complete least-squares objective.
 *
 * Scenarios:
 * 1. Nonsymmetric tall rows and a noisy right side preserve objective values for independent variable choices and singular values from direct original-design Jacobi SVD.
 * 2. Zero/rank-deficient designs remain unresolved instead of acquiring invented rank, and no caller array is modified.
 * 3. Empty, wide, ragged, nonfinite, overflowing and over-budget inputs refuse before returning a misleading factor.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public reducer and asserts objective equality, full singular spectrum, triangular storage, original input ownership and refusal effects. These distinguish right-side omission and normal-matrix or residual-dropping substitutions.
 * @evidence contracts/testing.md#independent-expectations Direct scalar residual sums for prescribed x include the independently computed constant norm; original-row Jacobi SVD supplies a different orthogonalization route for singular values, without claiming an external high-relative-accuracy reference.
 * @evidence contracts/testing.md#distinguishing-cases Covers noisy/exact, tall/square, zero/deficient, multiple x values, unchanged inputs, exact admission work boundary, malformed shapes, nonfinite actions and allocation ceilings.
 * @evidence contracts/testing.md#execution-ownership The portable test_math_qr_design entry owns numerical arrays only and starts no filesystem host, process, native compiler, browser, installation or GPU.
 */
export function test_math_qr_design(): void {
  const rows: number[][] = Array.from(
    { length: 9 },
    (_: unknown, at: number): number[] => [1, (at - 4) / 3, Math.sin(at + 0.2)],
  );
  const right: number[] = rows.map(
    (row: number[], at: number): number =>
      2 * row[0]! - row[1]! + 0.5 * row[2]! + 0.03 * Math.cos(2 * at),
  );
  const saved: string = JSON.stringify({ rows, right });
  const reduced: ReturnType<typeof reduceAutoMovieQrDesign> =
    reduceAutoMovieQrDesign(rows, right, { maxEntries: 27, maxWork: 108 });
  for (const x of [
    [0, 0, 0],
    [2, -1, 0.5],
    [-3, 2, 4],
  ]) {
    const original: number = rows.reduce(
      (sum: number, row: number[], at: number): number =>
        sum +
        (row.reduce(
          (dot: number, value: number, column: number): number =>
            dot + value * x[column]!,
          0,
        ) -
          right[at]!) **
          2,
      0,
    );
    const compressed: number = reduced.rows.reduce(
      (sum: number, row: number[], at: number): number =>
        sum +
        (row.reduce(
          (dot: number, value: number, column: number): number =>
            dot + value * x[column]!,
          0,
        ) -
          reduced.right[at]!) **
          2,
      reduced.orthogonalResidualNorm ** 2,
    );
    TestValidator.predicate(
      "unchanged complete objective",
      nclose(original, compressed, 1e-10),
    );
  }
  const budget: Parameters<typeof decomposeAutoMovieSingularMatrix>[1] = {
    maxEntries: 27,
    maxSweeps: 64,
    orthogonalityTolerance: 1e-12,
  };
  const originalFactors: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(rows, budget);
  const compressedFactors: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(reduced.rows, budget);
  TestValidator.predicate(
    "orthogonal compression preserves original singular values",
    originalFactors.singularValues.every((value: number, at: number): boolean =>
      nclose(value, compressedFactors.singularValues[at]!, 1e-10),
    ),
  );
  TestValidator.predicate(
    "upper triangle and bounded actual work",
    reduced.rows.every((row: number[], at: number): boolean =>
      row.every(
        (value: number, column: number): boolean => column >= at || value === 0,
      ),
    ) &&
      reduced.transformedCells <= 108 &&
      saved === JSON.stringify({ rows, right }),
  );
  const deficient: ReturnType<typeof reduceAutoMovieQrDesign> =
    reduceAutoMovieQrDesign(
      [
        [1, 2],
        [2, 4],
        [3, 6],
      ],
      [2, 4, 6],
      { maxEntries: 6, maxWork: 18 },
    );
  const rank: ReturnType<typeof decomposeAutoMovieSingularMatrix> =
    decomposeAutoMovieSingularMatrix(deficient.rows, {
      ...budget,
      maxEntries: 6,
    });
  TestValidator.predicate(
    "rank is not restored",
    rank.singularValues[1]! < 1e-10,
  );
  const zero: ReturnType<typeof reduceAutoMovieQrDesign> =
    reduceAutoMovieQrDesign([[0], [0]], [3, 4], { maxEntries: 2, maxWork: 4 });
  TestValidator.predicate(
    "zero design retains orthogonal constant",
    zero.rows[0]![0] === 0 && nclose(zero.orthogonalResidualNorm, 5, 1e-12),
  );
  const refused: (() => unknown)[] = [
    (): unknown =>
      reduceAutoMovieQrDesign([], [], { maxEntries: 1, maxWork: 1 }),
    (): unknown =>
      reduceAutoMovieQrDesign([[1, 2]], [1], { maxEntries: 6, maxWork: 6 }),
    (): unknown =>
      reduceAutoMovieQrDesign([[1], [1, 2]], [1, 2], {
        maxEntries: 6,
        maxWork: 6,
      }),
    (): unknown =>
      reduceAutoMovieQrDesign([[NaN]], [1], { maxEntries: 2, maxWork: 2 }),
    (): unknown =>
      reduceAutoMovieQrDesign([[1]], [Infinity], { maxEntries: 2, maxWork: 2 }),
    (): unknown =>
      reduceAutoMovieQrDesign(
        [[1e308], [1e308], [1e308], [1e308]],
        [0, 0, 0, 0],
        { maxEntries: 4, maxWork: 8 },
      ),
    (): unknown =>
      reduceAutoMovieQrDesign(rows, right, { maxEntries: 26, maxWork: 108 }),
    (): unknown =>
      reduceAutoMovieQrDesign(rows, right, { maxEntries: 27, maxWork: 107 }),
  ];
  for (const action of refused) {
    let threw: boolean = false;
    try {
      action();
    } catch {
      threw = true;
    }
    TestValidator.predicate("unsupported input refuses", threw);
  }
}
