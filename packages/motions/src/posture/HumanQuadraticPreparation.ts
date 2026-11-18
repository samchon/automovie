import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import { HumanQuadraticAdmission } from "./HumanQuadraticAdmission";
import { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticEquilibration as Equilibration } from "./HumanQuadraticEquilibration";
import type { HumanQuadraticWorkspace as Work } from "./HumanQuadraticWorkspace";

/**
 * Numeric preparation shared by solves of one convexification. Modified Ruiz
 * equilibration follows Stellato et al. 2020, section 5.1, algorithm 2
 * (`HumanQuadraticEquilibration`). A preparation belongs to its caller
 * (`IOwner`, a session or a fixed model), never to this module: the caller's
 * last preparation is only a candidate, reused when its dimensions, every P,
 * q and nonzero A entry and the scaling it was built on match, so a solve's
 * scaling never depends on what another caller solved before it. Bounds and
 * weights belong to each solve; iterates and adaptive step sizes are never
 * retained here. Costs use w=band+1, S supplied curvature entries, R
 * original row entries, Z stored entries after exact-zero compression and m
 * rows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the Ruiz source, caller ownership, exact dependency checks, solve-local intervals and absence of retained iterates or adaptive parameters.
 * @evidence contracts/development/design.md#principled-representation Groups only admitted numeric preparation; positive scaling preserves the original variable and row units.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The internal scaled and factor functions serve the existing quadratic solvers without changing their public problem or state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses no body, plan, fixture key, module cache or approximate numeric equivalence; the caller's record only offers copied dependencies to compare.
 */
export namespace HumanQuadraticPreparation {
  /**
   * Admit every original entry, omit exact zero coefficients and equilibrate
   * P, q and A. Nonzero order, duplicate indices and empty rows are preserved.
   * The owner's last preparation is reused when its data and the scaling it
   * was built on are this program's; q participates in the cost scaling and
   * therefore also invalidates preparation when it changes.
   *
   * @param problem The convex banded program; bounds may be infinite on their absent sides.
   * @param fixed The variables' and the cost's scales of an earlier program of the same variables (one optimisation's first subproblem, `IScaling`): the program is then scaled by them in one pass and each row by one Ruiz row step on them, in place of the ten passes; ignored when its length is not the program's. Absent, the ten passes run.
   * @param owner The caller's record of its last preparation, read as the candidate and replaced by this one; absent, nothing is shared or kept.
   * @returns The numeric core with fresh scaled bounds and weights.
   * @throws {RangeError} For malformed or nonfinite data, an original row outside the band, or noninvertible scaling.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses modified Ruiz equilibration from Stellato et al. 2020, algorithm 2, with the existing ten passes and scaling limits; exact zero omission preserves the finite real quadratic program.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns admission, compression and numeric preparation once for the public quadratic solver; banded algebra remains in HumanQuadraticBand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses exact comparisons and exact zero omission, preserving small coefficients, duplicate entries, row order, penalties and solver tolerances.
   * @evidence contracts/development/implementation.md#efficient-algorithms Admission and exact comparison take O(S+R+n+m), including supplied trailing curvature storage; misses add preparation's documented scaling cost, while hits allocate three row-sized bound and weight arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Full P/q/A equality with the owner's last preparation, built on the same scaling, shares its complete scaled core. Misses may share its proved raw groups/topology, but run every scaling pass; final finite scans compare the new scaled P/A pair exactly and may share only that pair's identity. Current q, scales and residual metadata remain independent.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owner retains one numeric preparation, O(S+n*w+Z+n+m), including inverse scales, until its next preparation replaces it or the owner is dropped; nothing is kept by this module. Fresh solve wrappers borrow raw rows, fixed models replace that loan with copies, and neither enters the retained core. A miss consumes fresh lo as scale scratch before overwriting it.
   * @evidence contracts/development/common.md#meaningful-documentation States the scaling source, zero and duplicate semantics, validation failures, caller ownership, exact reuse dependencies and retained-data lifetime.
   */
  export function scaled(
    problem: IAutoMovieMotionHumanQuadraticProgram.IProblem,
    fixed?: IScaling,
    owner?: IOwner,
  ): B.IScaled {
    let prepared: IPrepared | undefined = owner?.prepared;
    const admitted: ReturnType<typeof HumanQuadraticAdmission> =
      HumanQuadraticAdmission(problem, prepared);
    const lo: Float64Array = new Float64Array(problem.rows.length);
    const scaling: IScaling | undefined =
      fixed !== undefined && fixed.d.length === problem.n ? fixed : undefined;

    // A preparation equilibrated otherwise is another program's scaling,
    // however equal its data: reusing it would make the scaling depend on
    // the order of the owner's solves.
    if (
      prepared === undefined ||
      !admitted.same ||
      !same(prepared.fixed, scaling)
    )
      prepared = Equilibration.of(problem, admitted, lo, prepared, scaling);
    const core: ICore = prepared.core;
    const hi: Float64Array = new Float64Array(core.m);
    const weight: Float64Array = new Float64Array(core.m);
    problem.rows.forEach(
      (row: IAutoMovieMotionHumanQuadraticProgram.IRow, r: number): void => {
        lo[r] = row.l * core.e[r]!;
        hi[r] = row.u * core.e[r]!;
        weight[r] =
          row.weight === undefined ? -1 : (core.c * row.weight) / core.e[r]!;
        if (
          (Number.isFinite(row.l) && !Number.isFinite(lo[r]!)) ||
          (Number.isFinite(row.u) && !Number.isFinite(hi[r]!)) ||
          !Number.isFinite(weight[r]!)
        )
          throw new RangeError(`Quadratic row ${r} overflows its scaling`);
      },
    );
    if (owner !== undefined) owner.prepared = prepared;
    return { ...core, lo, hi, weight, raw: problem.rows };
  }
  /**
   * The initial ADMM factor for these scaled matrices, row step sizes and
   * proximal term. A fixed model keeps the factor it is given
   * (`HumanQuadraticWorkspace.IMemory.initialFactor`) and asks again only
   * when its bound classification changes rho. Adaptive factors and
   * polishing belong to their separate one-shot or persistent workspace
   * owner.
   *
   * @param s The scaled program with this solve's bounds and weights.
   * @param rho This solve's initial positive row step sizes.
   * @param sigma The positive proximal term.
   * @returns The immutable initial Cholesky factor.
   * @throws {RangeError} For nonpositive or nonfinite parameters or a nonfinite factor.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Factors the reduced system Pbar plus sigma I plus Abar transpose diag(rho) Abar, the OSQP indirect system.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validates the parameters, factors once and admits the factor's entries; adaptive rho updates and active-set polishing keep their existing banded-algebra calls.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Validates the complete rho vector and sigma and preserves every current solver parameter and convergence check.
   * @evidence contracts/development/implementation.md#efficient-algorithms Validates m step sizes, then Band.factor's O(n*w+sum(k_r*k_r)+n*w*w) canonical-band assembly and factorization; original supplied padding is already admitted.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The factor's reuse is its caller's: a fixed model keeps it in its memory while its rho is unchanged; current q, unit scales, bounds, weights and iterates do not enter this reduced matrix.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the returned factor is the caller's.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the matrix, factor invalidation, read-only consumption and failure cases.
   */
  export function factor(
    s: B.IScaled,
    rho: Float64Array,
    sigma: number,
  ): Work.IFactor {
    if (!(sigma > 0) || !Number.isFinite(sigma) || rho.length !== s.m)
      throw new RangeError("Quadratic step sizes must be finite and positive");
    for (let r: number = 0; r < rho.length; ++r) {
      const value: number = rho[r]!;
      if (!(value > 0) || !Number.isFinite(value))
        throw new RangeError(
          "Quadratic step sizes must be finite and positive",
        );
    }
    const out: Work.IFactor = B.factor(s, rho, sigma);
    for (const row of out.system) Equilibration.finite(row, "Quadratic factor");
    return out;
  }

  /**
   * The variables' and the cost's equilibration scales of one program, which
   * a later program of the same variables reuses (`scaled`'s `fixed`): any
   * positive diagonal scaling leaves a program's minimiser where it is
   * (the scaled program is the same program in other units), so a solve of
   * one optimisation's later subproblems on its first subproblem's scales
   * finds the same step to its own accuracy, read on the data so scaled.
   *
   * @evidence contracts/development/design.md#principled-representation The variables' scales D (one positive number a variable, the unit of x = D x-bar) and the cost's scale c, the two parts of Ruiz equilibration that depend on the variables and not on the rows.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Made by `HumanQuadraticInterior` from its first solve of a session and read by `scaled`; the rows' scales are each program's own.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No row, bound, weight or solution is carried; a length unlike the program's is not used.
   * @evidence contracts/development/common.md#meaningful-documentation States the two scales, their units and why reusing them leaves the solution.
   */
  export interface IScaling {
    /** The variables' scales, positive, one a variable. */
    d: Float64Array;

    /** The cost's scale, positive. */
    c: number;
  }

  /**
   * A caller's record of its last preparation (a session's, a fixed
   * model's), which `scaled` reads as its candidate and replaces.
   *
   * @evidence contracts/development/design.md#principled-representation One optional preparation, the only state a caller lends `scaled`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Held by `HumanQuadraticInteriorSession.ISession`; written and read by `scaled` alone.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No module-level map: the caller's lifetime bounds the preparation's.
   * @evidence contracts/development/common.md#meaningful-documentation States who holds the record and what `scaled` does with it.
   */
  export interface IOwner {
    /** The last preparation `scaled` made or reused for this caller. */
    prepared?: IPrepared;
  }

  /**
   * Copied dependencies and current immutable preparation for one owner.
   *
   * @evidence contracts/development/design.md#principled-representation Stores admitted original-unit P/q and ordered nonzero A beside their equilibrated core and the scaling it was built on, plus two distinct disposable n-entry scaling buffers whose complete overwrite is factory-owned; numeric snapshots enforce compatible dimensions and finite storage.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplies retained matrices, Admission's exact dependency snapshots and the equilibration's shape-matched scaling work through one caller-held record; work never enters public scaled data or state.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Holds no original problem, body, plan or result reference; copied dependencies and the copied scaling prove equivalence rather than trusting mutable source identity or an approximate numeric key.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the copied raw snapshots, the recorded scaling, their ordered CSR correspondence and the internal admission consumer.
   */
  export interface IPrepared {
    /** Original curvature, including its supplied row lengths. */
    p: Float64Array[];

    /** Original linear term, since it controls cost equilibration. */
    q: Float64Array;

    /** Original ordered nonzero coefficients, parallel to core.cols. */
    vals: Float64Array;

    /** Equilibrated matrices, compression and scales. */
    core: ICore;

    /** The variables' and cost's scales the core was built on (`scaled`'s `fixed`), copied; absent for the ten passes. */
    fixed?: IScaling;

    /** Disposable n-entry scaling work, fully reset before use and excluded from returned scaled cores. */
    scaling: {
      /** Current column-scale proposals, overwritten from curvature norms before each pass. */
      dx: Float64Array;

      /** Current curvature norms, reset to positive zero before each reduction. */
      curvature: Float64Array;
    };
  }
}

/**
 * Shared scaled matrices/scales without solve-local intervals or raw loans.
 *
 * Reuses Band.IScaled's numeric representation but excludes lo/hi/weight, raw layouts and lazy exceptional restoration, which belong to one-shot wrappers or fixed models.
 * Defines exactly the fields preparation retains and every algebra consumer reads; the existing scaled representation remains owned by Band.
 * Uses Omit on the owning type rather than a parallel matrix contract and stores no solver iterates.
 * Names the shared numeric core and why intervals, weights and original-input loans are excluded.
 */
type ICore = Omit<B.IScaled, "lo" | "hi" | "weight" | "raw" | "restored">;

/** Whether a preparation was built on the scaling a program asks for: both by the ten passes, or both on equal variable and cost scales. */
function same(
  built: HumanQuadraticPreparation.IScaling | undefined,
  asked: HumanQuadraticPreparation.IScaling | undefined,
): boolean {
  if (built === undefined || asked === undefined) return built === asked;
  if (!Object.is(built.c, asked.c) || built.d.length !== asked.d.length)
    return false;
  for (let i: number = 0; i < built.d.length; ++i)
    if (!Object.is(built.d[i], asked.d[i])) return false;
  return true;
}
