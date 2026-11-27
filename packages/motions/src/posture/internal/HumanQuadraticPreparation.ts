import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import { HumanQuadraticAdmission } from "./HumanQuadraticAdmission";
import { HumanQuadraticBand as B } from "./HumanQuadraticBand";
import { HumanQuadraticEquilibration as Equilibration } from "./HumanQuadraticEquilibration";
import type { HumanQuadraticWorkspace as Work } from "./HumanQuadraticWorkspace";

/*
 * Numeric preparation shared by solves of one convexification. Modified Ruiz
 * equilibration follows Stellato et al. 2020, section 5.1, algorithm 2
 * (`HumanQuadraticEquilibration`). A preparation belongs to its caller
 * (`IOwner`, a session or a fixed model), never to this module: the caller's
 * last preparation is only a candidate, reused when its dimensions, every P, q
 * and nonzero A entry and the scaling it was built on match, so a solve's
 * scaling never depends on what another caller solved before it. Bounds and
 * weights belong to each solve; iterates and adaptive step sizes are never
 * retained here. Costs use w=band+1, S supplied curvature entries, R original
 * row entries, Z stored entries after exact-zero compression and m rows.
 */
export namespace HumanQuadraticPreparation {
  /*
   * Admit every original entry, omit exact zero coefficients and equilibrate P,
   * q and A. Nonzero order, duplicate indices and empty rows are preserved. The
   * owner's last preparation is reused when its data and the scaling it was
   * built on are this program's; q participates in the cost scaling and
   * therefore also invalidates preparation when it changes.
   * Parameter problem: The convex banded program; bounds may be infinite on their
   * absent sides.
   * Parameter fixed: The variables' and the cost's scales of an earlier program of
   * the same variables (one optimisation's first subproblem, `IScaling`): the
   * program is then scaled by them in one pass and each row by one Ruiz row
   * step on them, in place of the ten passes; ignored when its length is not
   * the program's. Absent, the ten passes run.
   * Parameter owner: The caller's record of its last preparation, read as the
   * candidate and replaced by this one; absent, nothing is shared or kept.
   * Returns: The numeric core with fresh scaled bounds and weights.
   * For malformed or nonfinite data, an original row
   * outside the band, or noninvertible scaling.
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
      prepared = Equilibration(problem, admitted, lo, prepared, scaling);
    const core: ICore = prepared.core;
    const hi: Float64Array = new Float64Array(core.m);
    const weight: Float64Array = new Float64Array(core.m);
    problem.rows.forEach(
      (row: IAutoMovieMotionHumanQuadraticProgram.IRow, r: number): void => {
        lo[r] = row.l * core.e[r]!;
        hi[r] = row.u * core.e[r]!;
        weight[r] =
          row.weight === undefined ? -1 : (core.c * row.weight) / core.e[r]!;
      },
    );
    if (owner !== undefined) owner.prepared = prepared;
    return { ...core, lo, hi, weight };
  }
  /*
   * The initial ADMM factor for these scaled matrices, row step sizes and
   * proximal term. A fixed model keeps the factor it is given
   * (`HumanQuadraticWorkspace.IMemory.initialFactor`) and asks again only when
   * its bound classification changes rho. Adaptive factors and polishing belong
   * to their separate one-shot or persistent workspace owner.
   * Parameter s: The scaled program with this solve's bounds and weights.
   * Parameter rho: This solve's initial positive row step sizes.
   * Parameter sigma: The positive proximal term.
   * Returns: The immutable initial Cholesky factor.
   * For nonpositive or nonfinite parameters or a nonfinite
   * factor.
   */
  export function factor(
    s: B.IScaled,
    rho: Float64Array,
    sigma: number,
  ): Work.IFactor {
    if (!(sigma > 0) || rho.length !== s.m)
      throw new RangeError("Quadratic step sizes must be positive");
    for (let r: number = 0; r < rho.length; ++r) {
      const value: number = rho[r]!;
      if (!(value > 0))
        throw new RangeError("Quadratic step sizes must be positive");
    }
    const out: Work.IFactor = B.factor(s, rho, sigma);
    return out;
  }

  /*
   * The variables' and the cost's equilibration scales of one program, which a
   * later program of the same variables reuses (`scaled`'s `fixed`): any
   * positive diagonal scaling leaves a program's minimiser where it is (the
   * scaled program is the same program in other units), so a solve of one
   * optimisation's later subproblems on its first subproblem's scales finds the
   * same step to its own accuracy, read on the data so scaled.
   */
  export interface IScaling {
    /*
     * The variables' scales, positive, one a variable.
     */
    d: Float64Array;

    /*
     * The cost's scale, positive.
     */
    c: number;
  }

  /*
   * A caller's record of its last preparation (a session's, a fixed model's),
   * which `scaled` reads as its candidate and replaces.
   */
  export interface IOwner {
    /*
     * The last preparation `scaled` made or reused for this caller.
     */
    prepared?: IPrepared;
  }

  /*
   * Copied dependencies and current immutable preparation for one owner.
   */
  export interface IPrepared {
    /*
     * Original curvature, including its supplied row lengths.
     */
    p: Float64Array[];

    /*
     * Original linear term, since it controls cost equilibration.
     */
    q: Float64Array;

    /*
     * Original ordered nonzero coefficients, parallel to core.cols.
     */
    vals: Float64Array;

    /*
     * Equilibrated matrices, compression and scales.
     */
    core: ICore;

    /*
     * The variables' and cost's scales the core was built on (`scaled`'s
     * `fixed`), copied; absent for the ten passes.
     */
    fixed?: IScaling;

    /*
     * Disposable n-entry scaling work, fully reset before use and excluded from
     * returned scaled cores.
     */
    scaling: IPreparedScaling;
  }
}

/*
 * The record of `IPreparedScaling`'s site.
 */
type IPreparedScaling = {
  /*
   * Current column-scale proposals, overwritten from curvature norms before
   * each pass.
   */
  dx: Float64Array;

  /*
   * Current curvature norms, reset to positive zero before each reduction.
   */
  curvature: Float64Array;
};
/*
 * The alternatives of `Core`'s site.
 */
type Core = "lo" | "hi" | "weight";

/*
 * Shared scaled matrices/scales without solve-local intervals or raw loans.
 *
 * Reuses Band.IScaled's numeric representation but excludes lo/hi/weight, raw
 * layouts and lazy exceptional restoration, which belong to one-shot wrappers
 * or fixed models. Defines exactly the fields preparation retains and every
 * algebra consumer reads; the existing scaled representation remains owned by
 * Band. Uses Omit on the owning type rather than a parallel matrix contract and
 * stores no solver iterates. Names the shared numeric core and why intervals,
 * weights and original-input loans are excluded.
 */
type ICore = Omit<B.IScaled, Core>;

/*
 * Whether a preparation was built on the scaling a program asks for: both by
 * the ten passes, or both on equal variable and cost scales.
 */
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
