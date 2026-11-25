import { solveDenseActiveSet } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../../internal/PhysicalTolerance";

/**
 * How far the solver's minimizer may stand from the enumeration's: both solve
 * four-variable KKT systems by elimination, whose condition number up to about
 * 1e5 here scales the rounding to under 1e-7.
 */
const ENUMERATED: number = 1e-7;

/**
 * The dense solver returns the minimizer of a strictly convex program `min 1/2
 * x^T H x - h^T x` subject to `A x <= b`, the one an exhaustive
 * Karush-Kuhn-Tucker enumeration finds, so its change of variables onto the
 * identity-objective dual active-set method is exact.
 *
 * Scenarios:
 *
 * 1. Sixty seeded random programs, four variables, a symmetric positive definite H
 *    = M M^T + 0.1 I and six rows feasible at a random point: the solver's
 *    minimizer matches the enumeration's within 1e-7.
 * 2. Rows x0 <= -1 and -x0 <= -1 are infeasible: null.
 * 3. An indefinite H: null.
 */
export function test_unit_engine_physics_solve_dense_active_set(): void {
  let seed: number = 0x4017;
  const random = (): number => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648 - 0.5;
  };
  const n: number = 4;
  for (let trial: number = 0; trial < 60; trial++) {
    const m: number[][] = Array.from({ length: n }, (): number[] =>
      Array.from({ length: n }, (): number => random() * 2),
    );
    const h: number[][] = Array.from(
      { length: n },
      (_: unknown, i: number): number[] =>
        Array.from(
          { length: n },
          (_: unknown, j: number): number =>
            m[i]!.reduce(
              (sum: number, value: number, k: number): number =>
                sum + value * m[j]![k]!,
              0,
            ) + (i === j ? 0.1 : 0),
        ),
    );
    const linear: number[] = Array.from(
      { length: n },
      (): number => random() * 4,
    );
    const x0: number[] = Array.from({ length: n }, (): number => random());
    const rows: solveDenseActiveSet.IRow[] = Array.from(
      { length: 6 },
      (): solveDenseActiveSet.IRow => {
        const a: number[] = Array.from(
          { length: n },
          (): number => random() * 2,
        );
        return {
          a,
          b:
            a.reduce(
              (sum: number, value: number, k: number): number =>
                sum + value * x0[k]!,
              0,
            ) +
            random() +
            0.5,
        };
      },
    );
    const solved: number[] | null = solveDenseActiveSet({
      quadratic: h,
      linear,
      rows,
    });
    const expected: number[] = enumerate(h, linear, rows);
    TestValidator.predicate(
      `program ${trial}`,
      solved !== null &&
        solved.every(
          (value: number, i: number): boolean =>
            Math.abs(value - expected[i]!) <= ENUMERATED,
        ),
    );
  }

  // 2. Infeasible rows.
  const identity: number[][] = [
    [1, 0],
    [0, 1],
  ];
  TestValidator.equals(
    "infeasible",
    solveDenseActiveSet({
      quadratic: identity,
      linear: [0, 0],
      rows: [
        { a: [1, 0], b: -1 },
        { a: [-1, 0], b: -1 },
      ],
    }),
    null,
  );

  // 3. An indefinite matrix.
  TestValidator.equals(
    "indefinite",
    solveDenseActiveSet({
      quadratic: [
        [1, 0],
        [0, -1],
      ],
      linear: [0, 0],
      rows: [],
    }),
    null,
  );
}

/**
 * The minimizer by enumerating active sets: for each subset S of the rows,
 * solve H x + A_S^T mu = h, A_S x = b_S, and keep the candidate feasible for
 * every row with mu >= 0 of least objective.
 */
function enumerate(
  h: readonly (readonly number[])[],
  linear: readonly number[],
  rows: readonly solveDenseActiveSet.IRow[],
): number[] {
  const n: number = linear.length;
  let best: { x: number[]; cost: number } | undefined;
  for (let mask: number = 0; mask < 1 << rows.length; mask++) {
    const active: solveDenseActiveSet.IRow[] = rows.filter(
      (_: solveDenseActiveSet.IRow, i: number): boolean =>
        ((mask >> i) & 1) === 1,
    );
    if (active.length > n) continue;
    const size: number = n + active.length;
    const kkt: number[][] = Array.from({ length: size }, (): number[] =>
      new Array<number>(size + 1).fill(0),
    );
    for (let i: number = 0; i < n; i++) {
      for (let j: number = 0; j < n; j++) kkt[i]![j] = h[i]![j]!;
      active.forEach((row: solveDenseActiveSet.IRow, k: number): void => {
        kkt[i]![n + k] = row.a[i]!;
        kkt[n + k]![i] = row.a[i]!;
      });
      kkt[i]![size] = linear[i]!;
    }
    active.forEach((row: solveDenseActiveSet.IRow, k: number): void => {
      kkt[n + k]![size] = row.b;
    });
    const solution: number[] | undefined = gauss(kkt);
    if (!solution) continue;
    const x: number[] = solution.slice(0, n);
    const mu: number[] = solution.slice(n);
    const feasible: boolean = rows.every(
      (row: solveDenseActiveSet.IRow): boolean =>
        row.a.reduce(
          (sum: number, value: number, k: number): number =>
            sum + value * x[k]!,
          0,
        ) <=
        row.b + PhysicalTolerance.ACCUMULATED,
    );
    if (
      !feasible ||
      mu.some(
        (value: number): boolean => value < -PhysicalTolerance.ACCUMULATED,
      )
    )
      continue;
    const cost: number =
      0.5 *
        x.reduce(
          (sum: number, xi: number, i: number): number =>
            sum +
            xi *
              x.reduce(
                (inner: number, xj: number, j: number): number =>
                  inner + h[i]![j]! * xj,
                0,
              ),
          0,
        ) -
      x.reduce(
        (sum: number, xi: number, i: number): number => sum + xi * linear[i]!,
        0,
      );
    if (!best || cost < best.cost) best = { x, cost };
  }
  return best!.x;
}

/**
 * Gaussian elimination with partial pivoting on an augmented matrix; undefined
 * when singular.
 */
function gauss(matrix: number[][]): number[] | undefined {
  const size: number = matrix.length;
  for (let col: number = 0; col < size; col++) {
    let pivot: number = col;
    for (let row: number = col + 1; row < size; row++)
      if (Math.abs(matrix[row]![col]!) > Math.abs(matrix[pivot]![col]!))
        pivot = row;
    if (Math.abs(matrix[pivot]![col]!) < PhysicalTolerance.ROUNDING)
      return undefined;
    [matrix[col], matrix[pivot]] = [matrix[pivot]!, matrix[col]!];
    for (let row: number = 0; row < size; row++) {
      if (row === col) continue;
      const factor: number = matrix[row]![col]! / matrix[col]![col]!;
      for (let k: number = col; k <= size; k++)
        matrix[row]![k]! -= factor * matrix[col]![k]!;
    }
  }
  return matrix.map((row: number[], i: number): number => row[size]! / row[i]!);
}
