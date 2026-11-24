import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";

import { HumanQuadraticCholesky } from "./HumanQuadraticCholesky";
import { HumanQuadraticEntries } from "./HumanQuadraticEntries";
import { HumanQuadraticPolish } from "./HumanQuadraticPolish";
import { HumanQuadraticResiduals } from "./HumanQuadraticResiduals";
import { HumanQuadraticRow } from "./HumanQuadraticRow";
import { HumanQuadraticSubstitute } from "./HumanQuadraticSubstitute";
import { HumanQuadraticWorkspace as Work } from "./HumanQuadraticWorkspace";

/** The record of `IPolishResult`'s site. */
type IPolishResult = {
  x: Float64Array;
  z: Float64Array;
  y: Float64Array;
  products: Pick<Work.IWork, PolishProductsResult>;
};

/** The alternatives of `PolishProductsResult`'s site. */
type PolishProductsResult = "rows" | "transpose" | "productFiniteX";

/** The alternatives of `ResidualsKnown`'s site. */
type ResidualsKnown = "rows" | "transpose" | "productFiniteX";

/** The alternatives of `ScaledRestoredEntry`'s site. */
type ScaledRestoredEntry = "index" | "coef";

/** The alternatives of `ScaledRawItem`'s site. */
type ScaledRawItem = "index" | "coef";

/** The record of `IScaledTranspose`'s site. */
type IScaledTranspose = {
  /** N+1 column offsets into the parallel source row and entry buffers. */
  start: Int32Array;

  /**
   * Original row index of each contribution, in original order within its
   * column.
   */
  rows: Int32Array;

  /** Original CSR entry position supplying the current scaled coefficient. */
  entries: Int32Array;
};

/** The record of `IScaledFactorOrder`'s site. */
type IScaledFactorOrder = {
  /**
   * Prefix positions of each row's factor-only order; ordered rows own
   * empty spans.
   */
  start: Int32Array;

  /** Original CSR entry positions sorted by column then original position. */
  entries: Int32Array;
};

/** The record of `IScaledPPattern`'s site. */
type IScaledPPattern = {
  /** Exact numeric prefix positions of n curvature rows, with a final end. */
  start: Float64Array;

  /** Increasing relative column offsets within each original curvature row. */
  offsets: Float64Array;
};

/**
 * The linear algebra of `HumanQuadraticProgram`'s OSQP solve on a banded
 * problem: the banded reduced KKT system and its Cholesky factor, the unscaled
 * residuals, the primal infeasibility certificate and the polishing solve on
 * the active set (Stellato et al. 2020, Math Program Comput 12:637, sections
 * 3.4, 4 and 5.1). Costs use w=band+1, S supplied curvature entries, Z stored
 * row entries and m rows; a row r stores k_r entries.
 */
export namespace HumanQuadraticBand {
  /**
   * Equilibrated data: `P̄ = c D P D`, `q̄ = c D q`, `Ā = E A D`, `l̄ = E l`,
   * `ū = E u`, and soft weight `c w / E`.
   */
  export interface IScaled {
    /** The variables. */
    n: number;

    /** The rows. */
    m: number;

    /** The half-bandwidth. */
    band: number;

    /**
     * The scaled curvature's in-range upper band, without unused trailing
     * padding.
     */
    p: Float64Array[];

    /**
     * Admitted canonical P is exactly diagonal; finite positive Ruiz factors
     * preserve its off-diagonal signed zeros, and factors still use the full
     * band.
     */
    diagonal: boolean;

    /**
     * Packed sparse P positions with offset 0 first per row; absent metadata
     * uses the full band. Originally nonzero off-diagonal entries remain listed
     * after underflow.
     */
    pPattern?: IScaledPPattern;

    /** The scaled linear term. */
    q: Float64Array;

    /**
     * Infinity norm of unchanged scaled q for every dual residual
     * normalization.
     */
    qNorm: number;

    /**
     * Infinity norm of q[i]/(c*d[i]), using the unchanged residual
     * multiplication order and its original nonfinite propagation.
     */
    unscaledQNorm: number;

    /** Each row's first entry, compressed; `start[m]` is the entries' count. */
    start: Int32Array;

    /** Each entry's variable. */
    cols: Int32Array;

    /** Each entry's scaled coefficient. */
    vals: Float64Array;

    /**
     * One when a row's retained column indices are nondecreasing; duplicate
     * columns stay in their original order.
     */
    ordered: Uint8Array;

    /**
     * CSR entry position of a row with exactly one stored coefficient; -1 for
     * empty or multi-entry rows.
     */
    singleton: Int32Array;

    /**
     * Stable factor-only CSR positions for unordered rows; original row
     * products keep their original order.
     */
    factorOrder?: IScaledFactorOrder;

    /**
     * Column gathers preserving the original CSR contribution sequence for each
     * variable.
     */
    transpose: IScaledTranspose;

    /**
     * Original index/coef layout for exceptional zero restoration; one-shot
     * wrappers borrow admitted rows, fixed models copy only zero-bearing rows.
     * Absence means CSR already preserves that entire original row.
     */
    raw: readonly (
      | Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, ScaledRawItem>
      | undefined
    )[];

    /**
     * Lazily restored exceptional rows for this one-shot solve or fixed model;
     * O(R) original-layout storage, excluded from prepared core and public
     * iterates.
     */
    restored?: Map<
      number,
      Pick<IAutoMovieMotionHumanQuadraticProgram.IRow, ScaledRestoredEntry>
    >;

    /** Each row's scaled lower end. */
    lo: Float64Array;

    /** Each row's scaled upper end. */
    hi: Float64Array;

    /** Each soft row's scaled weight; -1 for a hard row. */
    weight: Float64Array;

    /** The variables' scaling `D`. */
    d: Float64Array;

    /** The rows' scaling `E`. */
    e: Float64Array;

    /** The cost's scaling. */
    c: number;

    /**
     * Each unchanged 1/(c*d[i]) for residual unit reversal; residual admission
     * retains the original nonfinite-result handling.
     */
    unscale: Float64Array;
  }

  /**
   * Infinity-norm residuals and their normalization scales, in both original
   * and equilibrated units. The solver rejects nonfinite iteration values.
   */
  export interface IResiduals {
    /** The unscaled primal residual `‖Ax - z‖∞`. */
    primal: number;

    /** Its scale, `max(‖Ax‖∞, ‖z‖∞)`. */
    primalScale: number;

    /** The unscaled dual residual `‖Px + q + Aᵀy‖∞`. */
    dual: number;

    /** Its scale, `max(‖Px‖∞, ‖Aᵀy‖∞, ‖q‖∞)`. */
    dualScale: number;

    /** The scaled primal residual. */
    scaledPrimal: number;

    /** Its scale. */
    scaledPrimalScale: number;

    /** The scaled dual residual. */
    scaledDual: number;

    /** Its scale. */
    scaledDualScale: number;
  }

  /**
   * The Cholesky factor of the reduced step system `P̄ + σI + Āᵀ diag(ρ) Ā`.
   *
   * @param s The scaled problem.
   * @param rho Each row's step size.
   * @param sigma The proximal term.
   * @param work Optional mutable owner for adaptive factorizations; absent for
   *   the independently cached initial factor.
   * @returns Upper U of K=UᵀU; persistent work retains it read-only until an
   *   exact dependency miss replaces it.
   */
  export function factor(
    s: IScaled,
    rho: Float64Array,
    sigma: number,
    work?: Work.IWork,
  ): Work.IFactor {
    const retained: Work.IAdaptive | undefined = work?.persistent
      ? work.adaptive
      : undefined;
    if (
      retained !== undefined &&
      retained.p === s.p &&
      Object.is(retained.sigma, sigma) &&
      retained.rho.length === rho.length &&
      rho.every((value: number, r: number): boolean =>
        Object.is(value, retained.rho[r]),
      )
    )
      return retained.matrices;
    const matrices: Work.IFactor = Work.system(s, sigma, work);
    const k: Float64Array[] = matrices.system;
    for (let r: number = 0; r < s.m; ++r) HumanQuadraticRow(s, k, r, rho[r]!);
    const upper: Work.IFactor = HumanQuadraticCholesky(matrices);
    if (work?.persistent) {
      const copied: Float64Array =
        retained?.rho.length === rho.length
          ? retained.rho
          : new Float64Array(rho.length);
      copied.set(rho);
      work.adaptive = { p: s.p, sigma, rho: copied, matrices };
      work.matrices = retained?.matrices;
    }
    return upper;
  }

  /**
   * Solve `Uᵀ U x = b` into `x`, using the in-place upper factor.
   *
   * @param u Completed upper factor and exact forward-row copies, with
   *   compatible stored dimensions.
   * @param b The right-hand side.
   * @param x The solution.
   * @param relaxed Optional distinct n-entry vector receiving
   *   alpha*x+(1-alpha)*old during final-value emission.
   * @param alpha Existing ADMM relaxation coefficient, one when no mixing is
   *   requested.
   * @returns Whether every final x component is finite, for the caller's
   *   unchanged exceptional-product branch.
   */
  export function substitute(
    u: Work.IFactor,
    b: Float64Array,
    x: Float64Array,
    relaxed?: Float64Array,
    alpha: number = 1,
  ): boolean {
    return HumanQuadraticSubstitute(u, b, x, relaxed, alpha);
  }

  /**
   * The residuals of an iterate of the scaled problem (section 3.4): the primal
   * `‖Ax - z‖∞` and the dual `‖Px + q + Aᵀy‖∞` of the unscaled problem with the
   * scales the termination test reads, and the same of the scaled problem,
   * which the step size balances.
   *
   * @param s The scaled problem.
   * @param x The scaled variables.
   * @param z The scaled row values.
   * @param y The scaled multipliers.
   * @param work Disposable solve-local products and diagnostic record.
   * @param known Optional completed Ax and A-transpose-y from the immediate
   *   polish producer; x, y and A must be unchanged.
   * @returns Borrowed residuals, overwritten by the next residual check.
   */
  export function residuals(
    s: IScaled,
    x: Float64Array,
    z: Float64Array,
    y: Float64Array,
    work: Work.IWork,
    known?: Pick<Work.IWork, ResidualsKnown>,
  ): IResiduals {
    return HumanQuadraticResiduals(s, x, z, y, work, known);
  }

  /**
   * Whether the multipliers' last change certifies the hard rows primal
   * infeasible (section 3.4): `δy` with `‖Aᵀδy‖∞ <= ε ‖δy‖∞` and `uᵀ max(δy,
   * 0)
   *
   * - Lᵀ min(δy, 0) < -ε ‖δy‖∞`, read unscaled. A soft row is never infeasible,
   *   so it is left out.
   *
   * @param s The scaled problem.
   * @param y The scaled multipliers.
   * @param before Their values one iteration before, consumed as delta-y
   *   scratch; the next ADMM iteration overwrites them.
   * @param epsilon The certificate's tolerance.
   * @param work Disposable solve-local transpose product.
   * @returns Whether the rows are certified infeasible.
   */
  export function infeasible(
    s: IScaled,
    y: Float64Array,
    before: Float64Array,
    epsilon: number,
    work: Work.IWork,
  ): boolean {
    const delta: Float64Array = before;
    let size: number = 0;
    let support: number = 0;
    for (let r: number = 0; r < s.m; ++r) {
      if (s.weight[r]! >= 0) {
        delta[r] = 0;
        continue;
      }
      const v: number = (s.e[r]! * (y[r]! - before[r]!)) / s.c;
      delta[r] = v;
      if (v === 0) continue;
      size = Math.max(size, Math.abs(v));
      if (v > 0) {
        const u: number = s.hi[r]! / s.e[r]!;
        support += u === Infinity ? Infinity : u * v;
      } else if (v < 0) {
        const l: number = s.lo[r]! / s.e[r]!;
        support += l === -Infinity ? Infinity : l * v;
      }
    }
    if (!(size > 0) || !(support < -epsilon * size)) return false;

    // Aᵀδy unscaled: D⁻¹ Āᵀ E⁻¹ δy.
    const aty: Float64Array = work.transpose;
    aty.fill(0);
    for (let r: number = 0; r < s.m; ++r) {
      const change: number = delta[r]!;
      const scale: number = s.e[r]!;
      if (Number.isFinite(change)) {
        for (let a: number = s.start[r]!; a < s.start[r + 1]!; ++a) {
          const index: number = s.cols[a]!;
          aty[index] = aty[index]! + (s.vals[a]! * change) / scale;
        }
      } else {
        const row: ReturnType<typeof HumanQuadraticEntries> =
          HumanQuadraticEntries(s, r);
        for (let a: number = 0; a < row.index.length; ++a) {
          const index: number = row.index[a]!;
          aty[index] = aty[index]! + (row.coef[a]! * change) / scale;
        }
      }
    }
    let norm: number = 0;
    for (let i: number = 0; i < s.n; ++i)
      norm = Math.max(norm, Math.abs(aty[i]! / s.d[i]!));
    return norm <= epsilon * size;
  }

  /**
   * The solution polished on its active set (section 4): the rows held on a
   * bound (a hard row whose value and multiplier say so, a soft row resting on
   * its bound with its multiplier below its weight) as equalities, a soft row
   * past its bound with its multiplier fixed at its weight, every other row
   * free; the KKT system of those rows, regularised by `δ`, solved in its
   * banded reduced form and refined `refine` times toward the system without
   * it.
   *
   * @param s The scaled problem.
   * @param z The scaled row values.
   * @param y The scaled multipliers.
   * @param delta The regularisation.
   * @param refine The refinement steps.
   * @param work Disposable ADMM buffers after that phase has ended.
   * @returns Scaled candidate iterates and borrowed products for their
   *   immediate residual admission before x, y or A changes.
   */
  export function polish(
    s: IScaled,
    z: Float64Array,
    y: Float64Array,
    delta: number,
    refine: number,
    work: Work.IWork,
  ): IPolishResult {
    return HumanQuadraticPolish(s, z, y, delta, refine, work);
  }
}
