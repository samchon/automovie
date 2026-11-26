import type {
  IAutoMovieQuadraticRow,
  IAutoMovieSolveQuadraticProgram,
} from "@automovie/interface";

import { solveAutoMovieQuadraticProgram } from "../math/internal/solveAutoMovieQuadraticProgram";
import { AutoMovieXpbdSupportRows as Rows } from "./AutoMovieXpbdSupportRows";
import { solveXpbdDualActiveSet as ActiveSet } from "./solveXpbdDualActiveSet";
import type { solveXpbdSupportCascade } from "./solveXpbdSupportCascade";

/**
 * The support cascade's levels (`solveXpbdSupportCascade`): one quadratic
 * program over the shared feasible set, the rows whose holds are independent,
 * and the regularization and acceptance they are solved to.
 */
export namespace solveXpbdSupportLevels {
  /**
   * One level: the warm active-set solve, else the interior-point solve; the warm
   * keys become the level's active set, or none after the fallback.
   */
  export function level(
    diagonal: number[],
    linear: number[],
    equalities: ActiveSet.IRow[],
    inequalities: ActiveSet.IRow[],
    keys: readonly string[],
    warm: string[],
  ): number[] | null {
    const known: ReadonlySet<string> = new Set(warm);
    const solved: ActiveSet.IResult | null = ActiveSet({
      diagonal,
      linear,
      equalities,
      inequalities,
      prefer: keys.flatMap((key: string, i: number): number[] =>
        known.has(key) ? [i] : [],
      ),
    });
    warm.length = 0;
    if (solved !== null) {
      for (const i of solved.active) warm.push(keys[i]!);
      return solved.primal;
    }
    const result: IAutoMovieSolveQuadraticProgram.IResult =
      solveAutoMovieQuadraticProgram({
        diagonal,
        linear,
        rows: [
          ...equalities.map(
            (row: ActiveSet.IRow): IAutoMovieQuadraticRow => ({
              indices: row.indices,
              weights: row.weights,
              lower: row.value,
              upper: row.value,
            }),
          ),
          ...inequalities.map(
            (row: ActiveSet.IRow): IAutoMovieQuadraticRow => ({
              indices: row.indices,
              weights: row.weights,
              lower: row.value,
              upper: null,
            }),
          ),
        ],
      });
    return result.status === 1 && result.maximumViolation <= ACCEPTANCE
      ? result.primal
      : null;
  }

  /**
   * The rows whose holds are independent. A row reads its body's velocity change
   * through its own unit impulse, `(r x d, d)`, so the rows of one patch on one
   * rigid body are dependent exactly when those functionals are: four coplanar
   * points span three. Gram-Schmidt over each patch's functionals, normals first,
   * keeps a row whose functional leaves more than `sqrt(eps)` of itself outside
   * the ones kept; the others hold with them, and leaving them out keeps the
   * program's equality rows of full rank.
   */
  export function independent(set: solveXpbdSupportCascade.ISet): Set<number> {
    const result: Set<number> = new Set();
    for (const patch of set.patches) {
      const basis: number[][] = [];
      for (const r of [...patch.normals, ...patch.tangents]) {
        const row: solveXpbdSupportCascade.IRow = set.rows[r]!;
        const functional: number[] = Rows.impulse(row);
        let rest: number[] = functional;
        for (const unit of basis) {
          const share: number = product(rest, unit);
          rest = rest.map(
            (value: number, m: number): number => value - share * unit[m]!,
          );
        }
        const left: number = Math.sqrt(product(rest, rest));
        if (
          left >
          REGULARIZATION * Math.sqrt(product(functional, functional))
        ) {
          basis.push(rest.map((value: number): number => value / left));
          result.add(r);
        }
      }
    }
    return result;
  }

  /** The dot product of two equal-length arrays. */
  export function product(a: readonly number[], b: readonly number[]): number {
    let sum: number = 0;
    for (let m: number = 0; m < a.length; ++m) sum += a[m]! * b[m]!;
    return sum;
  }

  /** The Tikhonov weight: the square root of float64's machine epsilon. */
  export const REGULARIZATION: number = Math.sqrt(Number.EPSILON);

  /**
   * The rows' violation an interior-point solve may leave and still count as
   * solved: the wrench allocation's own acceptance
   * (`distributePhysicalSupportWrench`).
   */
  export const ACCEPTANCE: number = 1e-6;
}
