import type { AutoMovieEnginePhysics } from "../AutoMovieEnginePhysics";
import { solveXpbdDualActiveSet } from "./solveXpbdDualActiveSet";

/**
 * A small dense strictly convex quadratic program, `min 1/2 x^T H x - h^T x`
 * subject to `A x <= b`, the form IHMC's `ICPControllerQPSolver` hands its
 * dense Goldfarb-Idnani solver (`JavaQuadProgSolver`, Apache-2.0), solved by
 * the same dual method on an exact change of variables: with the Cholesky
 * factor `H = L L^T` and `y = L^T x` the program is `min 1/2 y^T y - (L^-1 h)^T
 * y` subject to `(A L^-T) y <= b`, whose identity objective
 * `solveXpbdDualActiveSet` takes (Goldfarb and Idnani 1983), and `x = L^-T y`.
 * The change of variables is a bijection, so the minimizer is the dense
 * program's own.
 *
 * @param problem The objective's symmetric positive definite matrix and linear
 *   term, and the inequality rows `a x <= b`.
 * @returns The minimizer, or null when the matrix is not positive definite, the
 *   rows are infeasible or the method does not finish within its bound.
 */
export function solveDenseActiveSet(
  problem: AutoMovieEnginePhysics.ISolveDenseActiveSetProblem,
): number[] | null {
  const n: number = problem.linear.length;

  // H = L L^T, lower triangular L (Cholesky-Banachiewicz).
  const l: number[][] = Array.from({ length: n }, (): number[] =>
    new Array<number>(n).fill(0),
  );
  for (let i: number = 0; i < n; i++)
    for (let j: number = 0; j <= i; j++) {
      let sum: number = problem.quadratic[i]![j]!;
      for (let k: number = 0; k < j; k++) sum -= l[i]![k]! * l[j]![k]!;
      if (i === j) {
        if (!(sum > 0)) return null;
        l[i]![i] = Math.sqrt(sum);
      } else l[i]![j] = sum / l[j]![j]!;
    }

  // L^-1 v by forward substitution.
  const forward = (v: readonly number[]): number[] => {
    const out: number[] = new Array<number>(n).fill(0);
    for (let i: number = 0; i < n; i++) {
      let sum: number = v[i]!;
      for (let k: number = 0; k < i; k++) sum -= l[i]![k]! * out[k]!;
      out[i] = sum / l[i]![i]!;
    }
    return out;
  };
  const linear: number[] = forward(problem.linear).map(
    (value: number): number => -value,
  );

  // a x <= b becomes (L^-1 a^T)^T y <= b, written -(...) y >= -b.
  const inequalities: AutoMovieEnginePhysics.ISolveXpbdDualActiveSetRow[] = problem.rows.map(
    (row: AutoMovieEnginePhysics.ISolveDenseActiveSetRow): AutoMovieEnginePhysics.ISolveXpbdDualActiveSetRow => ({
      indices: Array.from({ length: n }, (_: unknown, i: number): number => i),
      weights: forward(row.a).map((value: number): number => -value),
      value: -row.b,
    }),
  );
  const solved: AutoMovieEnginePhysics.ISolveXpbdDualActiveSetResult | null = solveXpbdDualActiveSet({
    diagonal: new Array<number>(n).fill(1),
    linear,
    equalities: [],
    inequalities,
    prefer: [],
  });
  if (!solved) return null;

  // x = L^-T y by backward substitution.
  const x: number[] = new Array<number>(n).fill(0);
  for (let i: number = n - 1; i >= 0; i--) {
    let sum: number = solved.primal[i]!;
    for (let k: number = i + 1; k < n; k++) sum -= l[k]![i]! * x[k]!;
    x[i] = sum / l[i]![i]!;
  }
  return x;
}
