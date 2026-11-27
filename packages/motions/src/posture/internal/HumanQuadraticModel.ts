import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticPreparation as Preparation } from "./HumanQuadraticPreparation";
import { HumanQuadraticSolve } from "./HumanQuadraticSolve";
import { HumanQuadraticWorkspace as Workspace } from "./HumanQuadraticWorkspace";

/*
 * Admit and snapshot a fixed convexification without retaining its source.
 * Numeric preparation already owns scaled P/q/A copies.
 * Parameter problem: Finite convex banded data with admitted ordered row storage.
 * Parameter tolerance: The public quadratic solver's unchanged relative residual
 * tolerance.
 * Returns: One caller-owned fixed model; releasing it releases its scratch.
 * For malformed original data or noninvertible scaling.
 */
export function HumanQuadraticModel(
  problem: IAutoMovieMotionHumanQuadraticProgram.IProblem,
  tolerance: number,
): HumanQuadraticModel.IModel {
  const s: B.IScaled = Preparation.scaled(problem);
  const rows: Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, OfRowsItem>[] =
    problem.rows.map(
      (
        row: IAutoMovieMotionHumanQuadraticProgram.IRow,
      ): Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, OfRowsResult> => ({
        l: row.l,
        u: row.u,
        weight: row.weight,
        key: row.key,
      }),
    );
  const memory: Workspace.IMemory = {
    rho: new Float64Array(s.m),
    thresholds: new Float64Array(s.m),
    resetSteps: true,
    rowRhs: new Float64Array(s.m),
    softUpper: new Float64Array(s.m),
    softLower: new Float64Array(s.m),
    work: Workspace(
      new Float64Array(s.n),
      new Float64Array(s.n),
      new Float64Array(s.m),
      true,
    ),
  };
  return {
    solve: (
      bounds: readonly Pick<
        IAutoMovieMotionHumanQuadraticProgram.IRow,
        OfBoundsItem
      >[],
      warm?: IAutoMovieMotionHumanQuadraticProgram.IState,
      duals?: ReadonlyMap<string, number>,
    ): IAutoMovieMotionHumanQuadraticProgram.IState => {
      if (bounds.length !== s.m)
        throw new RangeError("Malformed quadratic row count");
      for (let r: number = 0; r < s.m; ++r) {
        const next:
          | Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, OfNext>
          | undefined = bounds[r];
        if (next === undefined)
          throw new RangeError(`Malformed quadratic row ${r}`);
        const row: Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, OfRow> =
          rows[r]!;
        row.key = next.key;
        const l: number = next.l;
        const u: number = next.u;
        const weight: number | undefined = next.weight;
        if (
          Object.is(row.l, l) &&
          Object.is(row.u, u) &&
          Object.is(row.weight, weight)
        )
          continue;
        if (
          !(l < Infinity) ||
          !(u > -Infinity) ||
          l > u ||
          (weight !== undefined && !(weight >= 0))
        )
          throw new RangeError(`Malformed quadratic row ${r}`);
        const lo: number = l * s.e[r]!;
        const hi: number = u * s.e[r]!;
        const scaledWeight: number =
          weight === undefined ? -1 : (s.c * weight) / s.e[r]!;

        // Initial rho depends on scaled free/equality/interval classes,
        // not the interval values or penalty. Fixed matrices and SIGMA
        // stay unchanged; only a changed class invalidates this factor.
        const changedClass: boolean =
          (s.lo[r] === -Infinity && s.hi[r] === Infinity) !==
            (lo === -Infinity && hi === Infinity) ||
          (s.lo[r] === s.hi[r]) !== (lo === hi);
        if (changedClass) memory.initialFactor = undefined;
        if (changedClass || !Object.is(s.weight[r], scaledWeight))
          memory.resetSteps = true;
        s.lo[r] = lo;
        s.hi[r] = hi;
        s.weight[r] = scaledWeight;
        row.l = l;
        row.u = u;
        row.weight = weight;
      }
      return HumanQuadraticSolve(rows, s, tolerance, warm, duals, memory);
    },
  };
}

/*
 * One convexification's owned numeric model. Fixed matrices are copied and
 * equilibrated once; later solves supply only intervals, penalties and keys.
 * Each solve runs OSQP anew, borrowing bounded scratch from this owner.
 */
export namespace HumanQuadraticModel {
  /*
   * A fixed P/q/A snapshot with a synchronous changing-bounds solve. Rebuild it
   * to change matrix values, dimensions, row order or coefficient order.
   */
  export interface IModel {
    /*
     * Solve this numeric snapshot with current ordered row intervals.
     * Parameter bounds: One current interval, optional weight and key per original
     * row; coefficient members on structural subtypes are not read.
     * Parameter warm: Optional compatible caller-owned unscaled iterates, left
     * unchanged.
     * Parameter duals: Optional keyed multipliers when warm is absent.
     * Returns: Fresh caller-owned unscaled iterates and current diagnostics.
     * For malformed intervals, incompatible warm data or
     * nonfinite computation.
     */
    solve(
      bounds: readonly Pick<
        IAutoMovieMotionHumanQuadraticProgram.IRow,
        SolveBoundsItem
      >[],
      warm?: IAutoMovieMotionHumanQuadraticProgram.IState,
      duals?: ReadonlyMap<string, number>,
    ): IAutoMovieMotionHumanQuadraticProgram.IState;
  }
}

/*
 * The alternatives of `OfRow`'s site.
 */
type OfRow = "l" | "u" | "weight" | "key";

/*
 * The alternatives of `OfNext`'s site.
 */
type OfNext = "l" | "u" | "weight" | "key";

/*
 * The alternatives of `OfBoundsItem`'s site.
 */
type OfBoundsItem = "l" | "u" | "weight" | "key";

/*
 * The alternatives of `OfRowsResult`'s site.
 */
type OfRowsResult = "l" | "u" | "weight" | "key";

/*
 * The alternatives of `OfRowsItem`'s site.
 */
type OfRowsItem = "l" | "u" | "weight" | "key";

/*
 * The alternatives of `SolveBoundsItem`'s site.
 */
type SolveBoundsItem = "l" | "u" | "weight" | "key";
