import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticPreparation as Preparation } from "./HumanQuadraticPreparation";
import type { HumanQuadraticProgram as Q } from "./HumanQuadraticProgram";
import { HumanQuadraticSolve } from "./HumanQuadraticSolve";
import { HumanQuadraticWorkspace as Workspace } from "./HumanQuadraticWorkspace";

/**
 * One convexification's owned numeric model. Fixed matrices are copied and
 * equilibrated once; later solves supply only intervals, penalties and keys.
 * Each solve runs OSQP anew, borrowing bounded scratch from this owner.
 *
 * @evidence contracts/development/design.md#principled-representation Separates fixed admitted P/q/A from variable row bounds and mutable iteration scratch; scaled matrices preserve their original units through D/E/c.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes only model creation and the bound-changing solve consumed by quadratic-program trust-region callers; public state remains HumanQuadraticProgram.IState.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses immutable copied numeric dependencies rather than mutable source identity or an answer cache; a new convexification creates a new model.
 * @evidence contracts/development/common.md#meaningful-documentation States fixed versus changing inputs, one-model ownership and independent OSQP execution.
 */
export namespace HumanQuadraticModel {
  /**
   * A fixed P/q/A snapshot with a synchronous changing-bounds solve. Rebuild
   * it to change matrix values, dimensions, row order or coefficient order.
   *
   * @evidence contracts/development/design.md#principled-representation Accepts exactly the changing interval/penalty/key portion of the original ordered rows and returns the existing unscaled state; coefficients belong to the owned snapshot.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains one solve method for fixed-matrix trust-region retries and no mutation, diagnostic or global-cache controls.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Models arbitrary admitted convex data without action names or a cached output; source changes require an explicit new fixed model.
   * @evidence contracts/development/common.md#meaningful-documentation Defines snapshot invalidation, changing-input order and result ownership.
   */
  export interface IModel {
    /**
     * Solve this numeric snapshot with current ordered row intervals.
     *
     * @param bounds One current interval, optional weight and key per original row; coefficient members on structural subtypes are not read.
     * @param warm Optional compatible caller-owned unscaled iterates, left unchanged.
     * @param duals Optional keyed multipliers when warm is absent.
     * @returns Fresh caller-owned unscaled iterates and current diagnostics.
     * @throws {RangeError} For malformed intervals, incompatible warm data or nonfinite computation.
     */
    solve(
      bounds: readonly Pick<Q.IRow, "l" | "u" | "weight" | "key">[],
      warm?: Q.IState,
      duals?: ReadonlyMap<string, number>,
    ): Q.IState;
  }

  /**
   * Admit and snapshot a fixed convexification without retaining its source.
   * Numeric preparation already owns scaled P/q/A copies; original row zeros
   * are copied too so exceptional IEEE products remain source-independent.
   *
   * @param problem Finite convex banded data with admitted ordered row storage.
   * @param tolerance The public quadratic solver's unchanged relative residual tolerance.
   * @returns One caller-owned fixed model; releasing it releases its scratch.
   * @throws {RangeError} For malformed original data or noninvertible scaling.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same exact-admission and modified Ruiz preparation as one-shot OSQP, then refreshes only positive-scaled bound and penalty data before the unchanged numeric solve.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns fixed-row copying, exact bound snapshots and scratch lifetime; changed intervals validate and scale before atomic replacement, while HumanQuadraticSolve owns ADMM and Preparation owns matrix scaling.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves ordered duplicates, all original zero coefficients, current interval validation and overflow rejection; neither the source object nor a previous answer supplies a later result.
   * @evidence contracts/development/implementation.md#efficient-algorithms One-time preparation has its documented S/R/n/w/Z/m cost, then copies O(R0+m) raw layout for R0 entries belonging to zero-bearing rows; CSR already owns all other coefficients. Each retry refreshes O(m) scalars without another matrix scan or numeric-array allocation for bounds and scratch.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Scaled P/q/A are immutable copied dependencies; current l/u/weight compare by Object.is with admitted snapshots, including signed zeros, so only changed values rescale. Keys always refresh, rho classifications recompute, and returned iterates never become scratch.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One model retains one scaled core, O(R0+m) copied zero-bearing raw rows, O(n+m) scratch and the bounded factor storage documented by Workspace; it retains no source or previous public result, and collection releases ownership.
   * @evidence contracts/development/common.md#meaningful-documentation Defines admission, source-independent numeric snapshots, changing-bound validation, scratch ownership and fresh output lifetime.
   */
  export function of(problem: Q.IProblem, tolerance: number): IModel {
    const s: B.IScaled = Preparation.scaled(problem);

    // CSR already copies every entry of a zero-free row. Only omitted
    // entries require an original-layout snapshot for exceptional products.
    const raw: (Pick<Q.IRow, "index" | "coef"> | undefined)[] = new Array(s.m);
    const rows: Pick<Q.IRow, "l" | "u" | "weight" | "key">[] = problem.rows.map(
      (row: Q.IRow, r: number): Pick<Q.IRow, "l" | "u" | "weight" | "key"> => {
        if (row.coef.length !== s.start[r + 1]! - s.start[r]!)
          raw[r] = { index: [...row.index], coef: [...row.coef] };
        return { l: row.l, u: row.u, weight: row.weight, key: row.key };
      },
    );
    s.raw = raw;
    const memory: Workspace.IMemory = {
      rho: new Float64Array(s.m),
      thresholds: new Float64Array(s.m),
      rowRhs: new Float64Array(s.m),
      work: Workspace.of(
        new Float64Array(s.n),
        new Float64Array(s.n),
        new Float64Array(s.m),
        true,
      ),
    };
    return {
      solve: (
        bounds: readonly Pick<Q.IRow, "l" | "u" | "weight" | "key">[],
        warm?: Q.IState,
        duals?: ReadonlyMap<string, number>,
      ): Q.IState => {
        if (bounds.length !== s.m)
          throw new RangeError("Malformed quadratic row count");
        for (let r: number = 0; r < s.m; ++r) {
          const next: Pick<Q.IRow, "l" | "u" | "weight" | "key"> | undefined =
            bounds[r];
          if (next === undefined)
            throw new RangeError(`Malformed quadratic row ${r}`);
          const row: Pick<Q.IRow, "l" | "u" | "weight" | "key"> = rows[r]!;
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
            !(Number.isFinite(l) || l === -Infinity) ||
            !(Number.isFinite(u) || u === Infinity) ||
            l > u ||
            (weight !== undefined && (!Number.isFinite(weight) || weight < 0))
          )
            throw new RangeError(`Malformed quadratic row ${r}`);
          const lo: number = l * s.e[r]!;
          const hi: number = u * s.e[r]!;
          const scaledWeight: number =
            weight === undefined ? -1 : (s.c * weight) / s.e[r]!;
          if (
            (Number.isFinite(l) && !Number.isFinite(lo)) ||
            (Number.isFinite(u) && !Number.isFinite(hi)) ||
            !Number.isFinite(scaledWeight)
          )
            throw new RangeError(`Quadratic row ${r} overflows its scaling`);
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
}
