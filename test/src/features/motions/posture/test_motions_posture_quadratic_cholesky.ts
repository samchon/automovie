import { HumanQuadraticCholesky } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a five-row banded factor of small integers. */
const ROUNDING: number = 1e-12;

/** The factor storage `HumanQuadraticCholesky` overwrites in place. */
type IFactor = Parameters<typeof HumanQuadraticCholesky>[0];

/**
 * The upper band of a dense symmetric matrix in the factor's storage: row i
 * holds K(i, i + j) at j, `min(band + 1, n − i)` entries, and the forward rows
 * hold `min(band, i)` entries each.
 */
function banded(dense: readonly (readonly number[])[], band: number): IFactor {
  const n: number = dense.length;
  const forwardStart: Float64Array = new Float64Array(n + 1);
  let entries: number = 0;
  for (let i: number = 0; i < n; ++i) {
    forwardStart[i] = entries;
    entries += Math.min(band, i);
  }
  forwardStart[n] = entries;
  return {
    n,
    band,
    system: dense.map(
      (row: readonly number[], i: number): Float64Array =>
        new Float64Array(Math.min(band + 1, n - i)).map(
          (_: number, j: number): number => row[i + j]!,
        ),
    ),
    forward: new Float64Array(entries),
    forwardStart,
  };
}

/** UᵀU of a dense upper-triangular U. */
function gram(u: readonly (readonly number[])[]): number[][] {
  return u.map((_: readonly number[], i: number): number[] =>
    u.map((__: readonly number[], j: number): number =>
      u.reduce(
        (sum: number, row: readonly number[]): number =>
          sum + row[i]! * row[j]!,
        0,
      ),
    ),
  );
}

/**
 * `HumanQuadraticCholesky` factors a symmetric positive-definite banded matrix
 * K = UᵀU in place (the triangular recurrence, LAPACK DPBTF2's upper-band
 * storage), copying each off-diagonal factor entry into its packed forward row;
 * with `dependent`, a radicand that has lost every digit to cancellation takes
 * the huge pivot of Wright's (1999) modified factorisation instead.
 *
 * The Cholesky factor with a positive diagonal is unique, so a K built as UᵀU
 * from a chosen U factors back to that U.
 *
 * Scenarios:
 *
 * 1. The tridiagonal [[4, 2, 0], [2, 5, 2], [0, 2, 5]] factors exactly to the
 *    bidiagonal U with diagonal 2 and superdiagonal 1, in place.
 * 2. A five-row K of half-bandwidth 2 built from a chosen U factors back to it
 *    within rounding, and each forward row holds U(t, i) for t from max(0, i −
 *    2) up to i, the same numbers as the band.
 * 3. The singular [[1, 1], [1, 1]] leaves a zero radicand on its second row: the
 *    1e-300 floor gives the pivot 1e-150, and `dependent` the pivot 1e32.
 */
export function test_motions_posture_quadratic_cholesky(): void {
  // 1. A tridiagonal matrix.
  const tridiagonal: IFactor = banded(
    [
      [4, 2, 0],
      [2, 5, 2],
      [0, 2, 5],
    ],
    1,
  );
  const factored: IFactor = HumanQuadraticCholesky(tridiagonal);
  TestValidator.predicate(
    "the factor overwrites its matrix",
    factored === tridiagonal,
  );
  TestValidator.equals(
    "the bidiagonal factor",
    factored.system.map((row: Float64Array): number[] => [...row]),
    [[2, 1], [2, 1], [2]],
  );

  // 2. A pentadiagonal matrix.
  const u: number[][] = [
    [2, 1, -1, 0, 0],
    [0, 3, 1, 2, 0],
    [0, 0, 1, -2, 1],
    [0, 0, 0, 2, 1],
    [0, 0, 0, 0, 3],
  ];
  const band: number = 2;
  const penta: IFactor = HumanQuadraticCholesky(banded(gram(u), band));
  TestValidator.predicate(
    "the chosen factor comes back",
    penta.system.every((row: Float64Array, i: number): boolean =>
      row.every((v: number, j: number): boolean =>
        nclose(v, u[i]![i + j]!, ROUNDING),
      ),
    ),
  );
  TestValidator.predicate(
    "each forward row copies its column of the band",
    u.every((_: number[], i: number): boolean => {
      const first: number = Math.max(0, i - band);
      return Array.from(
        { length: i - first },
        (__: unknown, a: number): number => first + a,
      ).every(
        (t: number): boolean =>
          penta.forward[penta.forwardStart[i]! + t - first] ===
          penta.system[t]![i - t],
      );
    }),
  );

  // 3. A dependent row.
  const singular: number[][] = [
    [1, 1],
    [1, 1],
  ];
  const floored: number = HumanQuadraticCholesky(banded(singular, 1))
    .system[1]![0]!;
  TestValidator.predicate(
    "the floor and the dependent pivot",
    nclose(floored / 1e-150, 1, ROUNDING) &&
      HumanQuadraticCholesky(banded(singular, 1), 1e-12).system[1]![0] === 1e32,
  );
}
