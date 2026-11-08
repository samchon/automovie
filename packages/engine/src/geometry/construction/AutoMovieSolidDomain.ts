import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/**
 * Pre-evaluation admission of solver trials to an actually owned chart.
 *
 * @evidence contracts/common.md#principled-implementation A finite trial must belong to the surface's declared inclusive station interval before its map or derivatives are evaluated.
 * @evidence contracts/common.md#clear-and-simple-design One shared reader distinguishes infeasible/unavailable numerical trials from genuine source callback failures.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No out-of-domain Taylor map, clamped geometry, fabricated derivative or catch-all exception recovery is introduced.
 * @evidence contracts/common.md#meaningful-documentation Missing domain permits every finite station; phase remains unwrapped and unavailable numeric jets return null.
 * @evidence contracts/performance.md#efficient-algorithms Constant scalar admission precedes one producer jet and its fixed-size output check.
 * @evidence contracts/performance.md#reuse-equivalent-work Returns the one admitted jet for residual, Jacobian and accepted-iterate reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns no cache or handle; admitted jets have six caller-owned vectors independent of subsequent producer queries.
 */
export namespace AutoMovieSolidDomain {
  /**
   * Finite chart membership without evaluating the surface.
   *
   * @evidence contracts/common.md#principled-implementation Uses exact inclusive comparisons against the current borrowed domain, without an ownership epsilon.
   * @evidence contracts/common.md#clear-and-simple-design Pure scalar admission is reusable before callbacks or line-search work.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not wrap phase, clamp station or infer a missing bound from sampled geometry.
   * @evidence contracts/common.md#meaningful-documentation Parameters use the surface's chart units; absent bounds authorize finite stations only.
   * @evidence contracts/performance.md#efficient-algorithms Constant finite/range tests with no jet evaluation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This predicate retains no previous query.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates and retains no result object or resource.
   */
  export function contains(
    surface: IAutoMovieSolidSurface,
    u: number,
    v: number,
  ): boolean {
    const bounds: [number, number] | undefined = surface.domain;
    return (
      Number.isFinite(u) &&
      Number.isFinite(v) &&
      (bounds === undefined || (u >= bounds[0] && u <= bounds[1]))
    );
  }

  /**
   * One admissible physical2 trial, or null before an unavailable evaluation.
   *
   * @evidence contracts/common.md#principled-implementation Feasible-domain safeguarding rejects outside trials before the source is read; only the explicit numeric admission class becomes nullable failure.
   * @evidence contracts/common.md#clear-and-simple-design The same returned jet supplies all equations at an accepted chart point.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Callback/getter and stale-binding errors keep their identity; missing physical2 is not zero-filled or replaced by a finite Point0.
   * @evidence contracts/common.md#meaningful-documentation Null means infeasible, unavailable or nonfinite required numeric output, not proof of no intersection.
   * @evidence contracts/performance.md#efficient-algorithms Constant admission and 18-component output tests/copies surround at most one producer query.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the admitted result instead of reevaluating for its finite check.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Six fresh vectors belong to the caller, so later producer queries cannot overwrite an accepted iterate, anchor or stored point; the call retains no producer result.
   */
  export function jet(
    surface: IAutoMovieSolidSurface,
    u: number,
    v: number,
  ): IAutoMovieSolidSurface.IJet | null {
    if (!contains(surface, u, v)) return null;
    try {
      const value: IAutoMovieSolidSurface.IJet = surface.jet(u, v);
      const rows: number[][] = [value.p, value.u, value.v, value.uu, value.uv, value.vv];
      const copied: [number, number, number][] = [];
      for (const row of rows) {
        if (row.length !== 3) return null;
        const owned: [number, number, number] = [0, 0, 0];
        for (let index: number = 0; index < 3; index++) {
          const component: number = row[index]!;
          if (!Number.isFinite(component)) return null;
          owned[index] = component;
        }
        copied.push(owned);
      }
      return { p: copied[0]!, u: copied[1]!, v: copied[2]!, uu: copied[3]!, uv: copied[4]!, vv: copied[5]! };
    } catch (error: unknown) {
      if (error instanceof AutoMovieLoftAdmissionError) return null;
      throw error;
    }
  }
}
