import type {
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMovieMotionHumanWalkStanceCourse,
} from "@automovie/interface";

import type { HumanQuadraticProgram as Q } from "../posture/HumanQuadraticProgram";
import type { walkStanceCourse } from "./walkStanceCourse";
import { walkStanceTerms } from "./walkStanceTerms";

/**
 * Prepare a stance problem's convexification reader. Its objective and
 * constraint derivatives depend on the course and held swivels, while the
 * steering penalty and restoration mode only select their contributions.
 * Knot frames, placements, schedules and the body remain fixed throughout
 * this problem; a different held-swivel object invalidates the reading.
 *
 * @param knots The problem's private knots, whose held swivels may change between reads.
 * @param size The number of course variables.
 * @param sweep The model's residual and constraint reader.
 * @returns Fresh quadratic storage for each penalty and objective selection.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed inputs, exact course/swivel equivalence, penalty/restoration selection and fresh output ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Assembles the same Gauss-Newton P and q and forward-difference constraint rows; mu multiplies only each row's l1 penalty, and restoration retains only the original 1e-9 diagonal regularization.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One bounded derivative record serves the existing sequential-convex steering calls at a course; walkStanceModel remains the only owner of residuals and physical constraints.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every residual, row key, coefficient, row order and diagonal guard; no sample, physics bound, solve or finite difference is removed.
 * @evidence contracts/development/implementation.md#efficient-algorithms A new course or swivel costs one original derivative sweep. Repeated penalties take O(n*b+R+m) copying for band b and R row entries, with O(n) exact course/swivel checks, instead of repeating geometric derivatives.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares only the latest exact scalar course and identical immutable held-swivel objects in this fixed-geometry problem; returned matrices and row arrays are copied so caller mutation cannot corrupt retained derivatives.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The problem-owned closure retains one course snapshot, one swivel list and one numeric linearisation, O(n*b+R+m), replaced on a changed input and released with the synchronous problem; no global cache or handle exists.
 */
export function walkStanceConvexify(
  knots: readonly IAutoMovieMotionHumanWalkStanceCourse.IKnot[],
  size: number,
  sweep: (
    x: Float64Array,
    linear: boolean,
    residual: (r: number, idx: number[], g: number[]) => void,
    constraint: (over: number, idx: number[], g: () => number[]) => void,
  ) => void,
): IAutoMovieMotionHumanWalkStanceCourse.IProblem["convexify"] {
  /** The last course's private derivatives, independent of steering choices. */
  let known: {
    x: Float64Array;
    swivels: (IAutoMovieMotionHumanWalkStanceCourse.ISwivel | undefined)[];
    p: Float64Array[];
    q: Float64Array;
    rows: IAutoMovieMotionHumanQuadraticProgram.IRow[];
  } | undefined;

  return (
    x: Float64Array,
    mu: number,
    objective: boolean = true,
  ): IAutoMovieMotionHumanQuadraticProgram.IProblem => {
    let same: boolean = known !== undefined && known.x.length === x.length;
    if (same)
      for (let i: number = 0; i < x.length; i++)
        if (!Object.is(known!.x[i], x[i])) {
          same = false;
          break;
        }
    let stance: number = 0;
    if (same)
      for (const knot of knots)
        for (const foot of knot.stances)
          if (known!.swivels[stance++] !== foot.swivel) same = false;

    if (!same) {
      const p: Float64Array[] = Array.from(
        { length: size },
        (): Float64Array => new Float64Array(walkStanceTerms.BAND + 1),
      );
      const q: Float64Array = new Float64Array(size);
      const rows: IAutoMovieMotionHumanQuadraticProgram.IRow[] = [];
      sweep(
        x,
        true,
        (r: number, idx: number[], g: number[]): void => {
          for (let a: number = 0; a < idx.length; a++) {
            q[idx[a]!]! += r * g[a]!;
            for (let b: number = 0; b < idx.length; b++)
              if (idx[a]! <= idx[b]!)
                p[idx[a]!]![idx[b]! - idx[a]!]! += g[a]! * g[b]!;
          }
        },
        (over: number, idx: number[], g: () => number[]): void => {
          rows.push({
            key: `c|${rows.length}`,
            index: idx,
            coef: g(),
            l: -Infinity,
            u: -over,
          });
        },
      );
      known = {
        x: Float64Array.from(x),
        swivels: knots.flatMap(
          (knot: IAutoMovieMotionHumanWalkStanceCourse.IKnot): (IAutoMovieMotionHumanWalkStanceCourse.ISwivel | undefined)[] =>
            knot.stances.map(
              (foot: IAutoMovieMotionHumanWalkStanceCourse.IStance): IAutoMovieMotionHumanWalkStanceCourse.ISwivel | undefined => foot.swivel,
            ),
        ),
        p,
        q,
        rows,
      };
    }

    const p: Float64Array[] = known!.p.map(
      (row: Float64Array): Float64Array => {
        const out: Float64Array = objective
          ? row.slice()
          : new Float64Array(row.length);
        out[0]! += 1e-9;
        return out;
      },
    );
    return {
      n: size,
      band: walkStanceTerms.BAND,
      p,
      q: objective ? known!.q.slice() : new Float64Array(size),
      rows: known!.rows.map(
        (row: IAutoMovieMotionHumanQuadraticProgram.IRow): IAutoMovieMotionHumanQuadraticProgram.IRow => ({
          ...row,
          index: [...row.index],
          coef: [...row.coef],
          weight: mu,
        }),
      ),
    };
  };
}
